using ShipNex.Application.DTOs;
using ShipNex.Application.Interfaces;

namespace ShipNex.Application.Interfaces;

/// <summary>
/// Publishes customer-safe realtime events to Supabase Realtime channels.
/// Only publicly-visible data is broadcast — no internal notes, audit logs,
/// private documents or other customers' data.
/// </summary>
public interface ISupabaseRealtimeService
{
    /// <summary>
    /// Broadcast a new customer-safe tracking event for a shipment to listeners
    /// subscribed to the shipment's realtime channel.
    /// </summary>
    Task PublishTrackingEventAsync(string trackingNumber, PublicTrackingEventResponse evt);

    /// <summary>
    /// Broadcast a shipment status/location update to listeners.
    /// </summary>
    Task PublishShipmentUpdateAsync(string trackingNumber, PublicShipmentTrackingResponse snapshot);

    /// <summary>
    /// Broadcast a customer-visible pet care event update.
    /// </summary>
    Task PublishPetCareEventAsync(string trackingNumber, PublicPetCareEventResponse evt);

    /// <summary>
    /// Broadcast route location updates for a pet shipment journey.
    /// </summary>
    Task PublishPetLocationUpdateAsync(string trackingNumber, string locationName, double? lat, double? lng, DateTime eventTime);
}
