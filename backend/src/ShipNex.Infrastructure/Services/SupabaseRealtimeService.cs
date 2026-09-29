using System.Net.Http.Headers;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using ShipNex.Application.DTOs;
using ShipNex.Application.Interfaces;

namespace ShipNex.Infrastructure.Services;

/// <summary>
/// Supabase Realtime publisher for customer-safe tracking updates.
///
/// Security model:
/// - Only customer-safe DTOs (PublicTrackingEventResponse, PublicShipmentTrackingResponse,
///   PublicPetCareEventResponse, etc.) are ever serialized and broadcast.
/// - The service role key used for admin operations is never exposed.
/// - Realtime channels are scoped to a single tracking number, so one customer
///   cannot receive another customer's shipment updates.
/// - If Supabase Realtime is misconfigured or unavailable, publishing fails silently
///   (logged) so tracking continues to work via normal polling/refresh.
/// </summary>
public class SupabaseRealtimeService : ISupabaseRealtimeService
{
    private readonly HttpClient _http;
    private readonly ILogger<SupabaseRealtimeService> _logger;
    private readonly string _supabaseUrl;
    private readonly string _realtimeApiKey; // anon key is fine for realtime broadcast
    private readonly bool _enabled;

    private static readonly JsonSerializerOptions JsonOpts = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        WriteIndented = false
    };

    public SupabaseRealtimeService(HttpClient http, IConfiguration configuration, ILogger<SupabaseRealtimeService> logger)
    {
        _http = http;
        _logger = logger;

        _supabaseUrl = (configuration["Realtime:SupabaseUrl"] ?? string.Empty).TrimEnd('/');
        _realtimeApiKey = configuration["Realtime:SupabaseAnonKey"] ?? string.Empty;

        _enabled = !string.IsNullOrWhiteSpace(_supabaseUrl) && !string.IsNullOrWhiteSpace(_realtimeApiKey);
        if (!_enabled)
        {
            _logger.LogWarning(
                "Supabase Realtime is disabled: Realtime:SupabaseUrl / Realtime:SupabaseAnonKey not configured. " +
                "Tracking will continue to work via normal refresh.");
        }

        if (_enabled)
        {
            _http.BaseAddress ??= new Uri(_supabaseUrl);
            _http.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", _realtimeApiKey);
        }
    }

    /// <summary>
    /// Channel name scoped to one tracking number. Listeners subscribe to
    /// "tracking:<trackingNumber>" — no cross-shipment leakage.
    /// </summary>
    private static string ChannelName(string trackingNumber) => $"tracking:{trackingNumber.Trim().ToUpperInvariant()}";

    public async Task PublishTrackingEventAsync(string trackingNumber, PublicTrackingEventResponse evt)
    {
        if (!_enabled) return;
        try
        {
            await PublishAsync(ChannelName(trackingNumber), "tracking_event", evt);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to publish tracking event for {TrackingNumber} via Supabase Realtime.", trackingNumber);
        }
    }

    public async Task PublishShipmentUpdateAsync(string trackingNumber, PublicShipmentTrackingResponse snapshot)
    {
        if (!_enabled) return;
        try
        {
            await PublishAsync(ChannelName(trackingNumber), "shipment_update", snapshot);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to publish shipment update for {TrackingNumber} via Supabase Realtime.", trackingNumber);
        }
    }

    public async Task PublishPetCareEventAsync(string trackingNumber, PublicPetCareEventResponse evt)
    {
        if (!_enabled) return;
        try
        {
            await PublishAsync(ChannelName(trackingNumber), "pet_care_event", evt);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to publish pet care event for {TrackingNumber} via Supabase Realtime.", trackingNumber);
        }
    }

    public async Task PublishPetLocationUpdateAsync(string trackingNumber, string locationName, double? lat, double? lng, DateTime eventTime)
    {
        if (!_enabled) return;
        try
        {
            var payload = new { locationName, latitude = lat, longitude = lng, eventTime };
            await PublishAsync(ChannelName(trackingNumber), "pet_location_update", payload);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to publish pet location update for {TrackingNumber} via Supabase Realtime.", trackingNumber);
        }
    }

    /// <summary>
    /// Broadcasts a payload to a Supabase Realtime broadcast channel using the
    /// server-side REST broadcast API:
    /// POST /realtime/v1/api/broadcast
    /// Body: { "messages": [ { "topic": "realtime:&lt;channel&gt;", "event": "...", "payload": {...}, "private": false } ] }
    /// </summary>
    private async Task PublishAsync(string channel, string eventName, object payload)
    {
        // Supabase Realtime REST broadcast (server-side publish):
        //   POST /realtime/v1/api/broadcast
        //   Body: { "messages": [ { topic, event, payload, private } ] }
        // Topics must be prefixed with "realtime:" for the REST API.
        var body = new
        {
            messages = new[]
            {
                new
                {
                    topic = $"realtime:{channel}",
                    @event = eventName,
                    payload = payload,
                    @private = false
                }
            }
        };

        var json = JsonSerializer.Serialize(body, JsonOpts);
        using var request = new HttpRequestMessage(HttpMethod.Post, "/realtime/v1/api/broadcast")
        {
            Content = new System.Net.Http.StringContent(json, System.Text.Encoding.UTF8, "application/json")
        };
        request.Headers.TryAddWithoutValidation("apikey", _realtimeApiKey);

        using var response = await _http.SendAsync(request);
        if (!response.IsSuccessStatusCode)
        {
            var errorBody = await response.Content.ReadAsStringAsync();
            throw new InvalidOperationException(
                $"Supabase Realtime broadcast failed (channel={channel}, status={response.StatusCode}): {errorBody}");
        }
    }
}
