using ShipNex.Domain.Enums;
using ShipNex.Domain.ValueObjects;

namespace ShipNex.Domain.Entities;

public class Shipment : BaseEntity
{
    public string TrackingNumber { get; set; } = string.Empty;
    public Guid CustomerId { get; set; }
    public ShipmentType ShipmentType { get; set; }
    public string ServiceType { get; set; } = string.Empty;
    public string Origin { get; set; } = string.Empty;
    public string Destination { get; set; } = string.Empty;
    public double? OriginLatitude { get; set; }
    public double? OriginLongitude { get; set; }
    public double? DestinationLatitude { get; set; }
    public double? DestinationLongitude { get; set; }
    public double? CurrentLatitude { get; set; }
    public double? CurrentLongitude { get; set; }
    public string CurrentLocationName { get; set; } = string.Empty;
    public ShipmentStatus Status { get; set; }
    public double Weight { get; set; }
    public int NumberOfPieces { get; set; }
    public string ReferenceNumber { get; set; } = string.Empty;
    public DateTime? EstimatedDelivery { get; set; }
    public string SenderName { get; set; } = string.Empty;
    public string SenderAddress { get; set; } = string.Empty;
    public string SenderPhone { get; set; } = string.Empty;
    public string ReceiverName { get; set; } = string.Empty;
    public string ReceiverAddress { get; set; } = string.Empty;
    public string ReceiverPhone { get; set; } = string.Empty;

    // Value Objects
    public Money ShippingCost { get; set; } = null!;
    public TrackingInfo Tracking { get; set; } = null!;

    // Navigation
    public Customer? Customer { get; set; }
    public ICollection<ShipmentTrackingEvent> TrackingEvents { get; set; } = new List<ShipmentTrackingEvent>();
    public ICollection<ShipmentLocation> Locations { get; set; } = new List<ShipmentLocation>();
    public ICollection<ShipmentDocument> Documents { get; set; } = new List<ShipmentDocument>();
}