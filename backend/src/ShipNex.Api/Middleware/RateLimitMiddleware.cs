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

    public RateLimitMiddleware(RequestDelegate next, ILogger<RateLimitMiddleware> logger, IConfiguration configuration)
    {
        _next = next;
        _logger = logger;
        _maxRequests = configuration.GetValue<int?>("RateLimit:MaxRequests") ?? 5;
        _timeWindow = TimeSpan.FromSeconds(configuration.GetValue<int?>("RateLimit:WindowSeconds") ?? 60);
        _trackingMaxRequests = configuration.GetValue<int?>("RateLimit:TrackingMaxRequests") ?? 30;
        _trackingTimeWindow = TimeSpan.FromSeconds(configuration.GetValue<int?>("RateLimit:TrackingWindowSeconds") ?? 60);
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
            var rateLimitInfo = _requestCounts.GetOrAdd(key, _ => new RateLimitInfo());

            lock (rateLimitInfo)
            {
                // Window slides per key: prune only this key's own history.
                rateLimitInfo.Requests.RemoveAll(r => now - r > window);
                if (rateLimitInfo.Requests.Count >= limit)
                {
                    _logger.LogWarning("Rate limited: {IP}", ipAddress);
                    context.Response.StatusCode = StatusCodes.Status429TooManyRequests;
                    context.Response.ContentType = "application/json";
                    var error = JsonSerializer.Serialize(new { status = 429, message = "Too many requests" });
                    context.Response.WriteAsync(error).Wait();
                    return;
                }
                rateLimitInfo.Requests.Add(now);
            }
        await _next(context);
    }

    private class RateLimitInfo
    {
        public List<DateTime> Requests { get; set; } = new();
    }
}
