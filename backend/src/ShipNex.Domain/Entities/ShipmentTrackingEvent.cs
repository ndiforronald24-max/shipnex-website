using ShipNex.Domain.Enums;

namespace ShipNex.Domain.Entities;

public class ShipmentTrackingEvent : BaseEntity
{
    public Guid ShipmentId { get; set; }
    public string Location { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public ShipmentStatus Status { get; set; }
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }
    public string? Notes { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;

    // Navigation
    public Shipment? Shipment { get; set; }
}