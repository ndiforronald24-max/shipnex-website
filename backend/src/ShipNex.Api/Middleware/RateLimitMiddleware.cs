using System.Collections.Concurrent;
using System.Text.Json;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace ShipNex.Api.Middleware;

/// <summary>
/// Simple in-memory rate limiting middleware for auth and public tracking endpoints.
/// Limits are configurable via "RateLimit:MaxRequests" and "RateLimit:WindowSeconds"
/// (defaults: 5 requests per 60 seconds per IP+path for auth).
/// Public tracking uses "RateLimit:TrackingMaxRequests"/"RateLimit:TrackingWindowSeconds"
/// (defaults: 30 requests per 60 seconds per IP). Integration tests raise the
/// limit via configuration so repeated calls don't trip the limiter.
/// </summary>
public class RateLimitMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<RateLimitMiddleware> _logger;
    private readonly int _maxRequests;
    private readonly TimeSpan _timeWindow;
    private readonly int _trackingMaxRequests;
    private readonly TimeSpan _trackingTimeWindow;
    private static readonly ConcurrentDictionary<string, RateLimitInfo> _requestCounts = new();

    // _requestCounts is only reaped when the SAME key is hit again, so entries are
    // never actually removed. An attacker rotating source IPs therefore grows this
    // dictionary without bound, and every entry pins a List<DateTime>. Sweeping idle
    // keys bounds it.
    private static readonly object _sweepLock = new();
    private static DateTime _lastSweepUtc = DateTime.MinValue;

    // The widest window in play, so one sweep threshold serves both limiters.
    private readonly TimeSpan _maxWindow;

    public RateLimitMiddleware(RequestDelegate next, ILogger<RateLimitMiddleware> logger, IConfiguration configuration)
    {
        _next = next;
        _logger = logger;
        _maxRequests = configuration.GetValue<int?>("RateLimit:MaxRequests") ?? 5;
        _timeWindow = TimeSpan.FromSeconds(configuration.GetValue<int?>("RateLimit:WindowSeconds") ?? 60);
        _trackingMaxRequests = configuration.GetValue<int?>("RateLimit:TrackingMaxRequests") ?? 30;
        _trackingTimeWindow = TimeSpan.FromSeconds(configuration.GetValue<int?>("RateLimit:TrackingWindowSeconds") ?? 60);
        _maxWindow = _timeWindow > _trackingTimeWindow ? _timeWindow : _trackingTimeWindow;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var path = context.Request.Path.Value?.ToLowerInvariant();
        if (path == null)
        {
            await _next(context);
            return;
        }

        int limit;
        TimeSpan window;
        if (path.Contains("/api/auth/login") || path.Contains("/api/auth/register"))
        {
            limit = _maxRequests;
            window = _timeWindow;
        }
        else if (path.StartsWith("/api/tracking"))
        {
            // Public tracking: no account required, so apply a reasonable per-IP limit.
            limit = _trackingMaxRequests;
            window = _trackingTimeWindow;
        }
        else
        {
            await _next(context);
            return;
        }
            var ipAddress = context.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        var key = $"{ipAddress}:{path}";
        var now = DateTime.UtcNow;
        TrySweepStaleKeys(now);
        var rateLimitInfo = _requestCounts.GetOrAdd(key, _ => new RateLimitInfo());

        var limited = false;

        lock (rateLimitInfo)
        {
            // Window slides per key: prune only this key's own history.
            rateLimitInfo.Requests.RemoveAll(r => now - r > window);
            if (rateLimitInfo.Requests.Count >= limit)
            {
                limited = true;
            }
            else
            {
                rateLimitInfo.Requests.Add(now);
            }
        }

        // Deliberately outside the lock: C# forbids awaiting inside a lock statement
        // (CS1996), which is why the 429 response used to be written with a blocking
        // .Wait() and could deadlock under load.
        if (limited)
        {
            _logger.LogWarning("Rate limited: {IP}", ipAddress);
            context.Response.StatusCode = StatusCodes.Status429TooManyRequests;
            context.Response.ContentType = "application/json";
            var error = JsonSerializer.Serialize(new { status = 429, message = "Too many requests" });
            await context.Response.WriteAsync(error);
            return;
        }

        await _next(context);
    }

    /// <summary>
    /// Drop keys with no live requests left. Without this the static dictionary only
    /// ever grows, so rotating source IPs is enough to exhaust the API's memory.
    /// </summary>
    private void TrySweepStaleKeys(DateTime now)
    {
        lock (_sweepLock)
        {
            if (now - _lastSweepUtc < _maxWindow) return;
            _lastSweepUtc = now;

            foreach (var entry in _requestCounts)
            {
                lock (entry.Value)
                {
                    entry.Value.Requests.RemoveAll(r => now - r > _maxWindow);
                    if (entry.Value.Requests.Count == 0)
                    {
                        _requestCounts.TryRemove(entry.Key, out _);
                    }
                }
            }
        }
    }

    private class RateLimitInfo
    {
        public List<DateTime> Requests { get; set; } = new();
    }
}
