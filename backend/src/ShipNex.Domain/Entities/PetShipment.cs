using ShipNex.Domain.Enums;

namespace ShipNex.Domain.Entities;

public class PetShipment : BaseEntity
{
    public string TrackingNumber { get; set; } = string.Empty;
    public Guid CustomerId { get; set; }
    public string OwnerName { get; set; } = string.Empty;
    public string OwnerPhone { get; set; } = string.Empty;
    public string OwnerEmail { get; set; } = string.Empty;
    public string PetName { get; set; } = string.Empty;
    public PetType PetType { get; set; }
    public string PetBreed { get; set; } = string.Empty;
    public int? PetAge { get; set; }
    public string? PetGender { get; set; }
    public double? Weight { get; set; }
    public string? MicrochipId { get; set; }
    public string? PhotoUrl { get; set; }
    public string Origin { get; set; } = string.Empty;
    public string Destination { get; set; } = string.Empty;
    public double? OriginLatitude { get; set; }
    public double? OriginLongitude { get; set; }
    public double? DestinationLatitude { get; set; }
    public double? DestinationLongitude { get; set; }
    public double? CurrentLatitude { get; set; }
    public double? CurrentLongitude { get; set; }
    public string CurrentLocationName { get; set; } = string.Empty;
    public PetJourneyStatus JourneyStatus { get; set; } = PetJourneyStatus.Registered;
    public DateTime? EstimatedDelivery { get; set; }
    public bool VaccinationVerified { get; set; } = false;
    public bool HealthCertificate { get; set; } = false;
    public string? SpecialInstructions { get; set; }
    public string? CustomerVisibleInformation { get; set; }
    public string? CarrierName { get; set; }
    public string ServiceType { get; set; } = "Standard";
    public string ShipmentType { get; set; } = "PetTransport";

    public Customer? Customer { get; set; }
    public ICollection<PetCareEvent> CareEvents { get; set; } = new List<PetCareEvent>();
    public ICollection<ShipmentDocument> Documents { get; set; } = new List<ShipmentDocument>();
    public ICollection<Notification> Notifications { get; set; } = new List<Notification>();
}
