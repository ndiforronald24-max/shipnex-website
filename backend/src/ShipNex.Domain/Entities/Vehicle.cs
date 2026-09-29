using ShipNex.Domain.Enums;

namespace ShipNex.Domain.Entities;

public class Vehicle : BaseEntity
{
    public string VIN { get; set; } = string.Empty;
    public string LicensePlate { get; set; } = string.Empty;
    public VehicleType VehicleType { get; set; }
    public string? Make { get; set; }
    public string? Model { get; set; }
    public int? Year { get; set; }
    public string? Color { get; set; }
    public Guid? OfficeId { get; set; }
    public string? DriverName { get; set; }
    public string? DriverPhone { get; set; }
    public string Status { get; set; } = "Available"; // Available, InUse, Maintenance
    public int? CapacityWeight { get; set; }
    public int? CapacityVolume { get; set; }
    public string? CurrentLocation { get; set; }
    public string? CurrentAddress { get; set; }
    public double? CurrentLatitude { get; set; }
    public double? CurrentLongitude { get; set; }
    public DateTime? LastMaintenanceDate { get; set; }
    public DateTime? NextMaintenanceDate { get; set; }
    public bool IsActive { get; set; } = true;

    // Navigation
    public Office? Office { get; set; }
}