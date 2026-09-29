using System.ComponentModel.DataAnnotations;

namespace ShipNex.Application.DTOs;

public record CreatePetShipmentRequest(
    [param: Required, StringLength(100)] string OwnerName,
    [param: Required, StringLength(20)] string OwnerPhone,
    [param: Required, EmailAddress, StringLength(254)] string OwnerEmail,
    [param: Required, StringLength(100)] string PetName,
    [param: Required, StringLength(50)] string PetType,
    [param: Required, StringLength(100)] string PetBreed,
    int? PetAge,
    string? PetGender,
    double? Weight,
    string? MicrochipId,
    string? PhotoUrl,
    [param: Required, StringLength(100)] string Origin,
    [param: Required, StringLength(100)] string Destination,
    [param: StringLength(50)] string? ServiceType,
    [param: StringLength(50)] string? ShipmentType,
    bool VaccinationVerified,
    bool HealthCertificate,
    string? SpecialInstructions,
    string? CustomerVisibleInformation,
    DateTime? EstimatedDelivery
);

public record UpdatePetShipmentRequest(
    string? OwnerName,
    string? OwnerPhone,
    string? OwnerEmail,
    string? PetName,
    string? PetBreed,
    int? PetAge,
    string? PetGender,
    double? Weight,
    string? SpecialInstructions,
    string? CustomerVisibleInformation,
    Guid? CustomerId,
    DateTime? EstimatedDelivery
);

public record UpdatePetLocationRequest(
    [param: StringLength(200)] string? CurrentLocationName,
    double? Latitude,
    double? Longitude,
    [param: StringLength(2000)] string? Description
);

public record UpdatePetStatusRequest(
    [param: Required, StringLength(50)] string JourneyStatus,
    [param: StringLength(200)] string? LocationName = null,
    double? Latitude = null,
    double? Longitude = null,
    [param: StringLength(2000)] string? Description = null
);

public record AddPetCareEventRequest(
    [param: Required, StringLength(50)] string EventType,
    [param: Required, StringLength(200)] string LocationName,
    [param: StringLength(2000)] string Description,
    double? Latitude,
    double? Longitude,
    bool CustomerVisible,
    DateTime? EventTime
);

public record PetShipmentResponse(
    string Id,
    string TrackingNumber,
    string OwnerName,
    string OwnerPhone,
    string OwnerEmail,
    string PetName,
    string PetType,
    string PetBreed,
    int? PetAge,
    string? PetGender,
    double? Weight,
    string? MicrochipId,
    string? PhotoUrl,
    string Origin,
    string Destination,
    double? OriginLatitude,
    double? OriginLongitude,
    double? DestinationLatitude,
    double? DestinationLongitude,
    double? CurrentLatitude,
    double? CurrentLongitude,
    string CurrentLocationName,
    string JourneyStatus,
    DateTime CreatedAt,
    DateTime? EstimatedDelivery,
    bool VaccinationVerified,
    bool HealthCertificate,
    string? SpecialInstructions,
    string? CustomerVisibleInformation,
    string? CarrierName,
    string ServiceType,
    string ShipmentType,
    List<PetCareEventResponse> CareEvents,
    List<PetDocumentResponse> Documents
);

public record PetCareEventResponse(
    string Id,
    string LocationName,
    string Description,
    string EventType,
    string CareStatus,
    DateTime EventTime,
    double? Latitude,
    double? Longitude,
    bool CustomerVisible
);
