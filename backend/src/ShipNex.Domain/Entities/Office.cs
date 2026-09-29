namespace ShipNex.Domain.Entities;

public class Office : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string? City { get; set; }
    public string? State { get; set; }
    public string? Country { get; set; }
    public string? Region { get; set; } // Africa, Europe, Asia, North America, South America, Middle East, Oceania
    public string? PostalCode { get; set; }
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }
    public string? Phone { get; set; }
    public string? Email { get; set; }
    public string? OpeningHours { get; set; }
    public string? ManagerName { get; set; }
    public string? ManagerPhone { get; set; }
    public string Type { get; set; } = "Hub"; // Hub, Branch, Airport, Port, etc.
    public bool IsActive { get; set; } = true;

    // Navigation
    public ICollection<Vehicle> Vehicles { get; set; } = new List<Vehicle>();
}