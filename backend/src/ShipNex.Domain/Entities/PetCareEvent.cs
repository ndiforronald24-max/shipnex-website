using ShipNex.Domain.Enums;

namespace ShipNex.Domain.Entities;

public class PetCareEvent : BaseEntity
{
    public Guid PetShipmentId { get; set; }
    public PetCareEventType Type { get; set; }
    public PetCareEventStatus CareStatus { get; set; }
    public string Description { get; set; } = string.Empty;
    public string? LocationName { get; set; }
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }
    public DateTime EventTime { get; set; } = DateTime.UtcNow;
    public bool CustomerVisible { get; set; } = true;
    public string? Notes { get; set; } // Internal notes - never exposed publicly

    // Navigation
    public PetShipment? PetShipment { get; set; }
}