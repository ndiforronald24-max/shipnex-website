namespace ShipNex.Domain.Entities;

public class ShipmentLocation : BaseEntity
{
    public string TrackingNumber { get; set; } = string.Empty;
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }
    public string LocationName { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string? City { get; set; }
    public string? State { get; set; }
    public string? Country { get; set; }
    public string? PostalCode { get; set; }
    public DateTime? Timestamp { get; set; }
    public string? LocationType { get; set; }
}