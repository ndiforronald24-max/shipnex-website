using ShipNex.Application.DTOs;
using ShipNex.Domain.Entities;

namespace ShipNex.Application.Mapping;

/// <summary>
/// Manual mapping methods for entity-to-DTO conversion.
/// Use these static methods instead of AutoMapper for better performance and explicit control.
/// </summary>
public static class MappingProfile
{
        // Shipment mappings
    public static ShipmentResponse ToResponse(Shipment s) => new(
        s.Id.ToString(),
        s.TrackingNumber,
        s.SenderName,
        s.ReceiverName,
        s.Origin,
        s.Destination,
        s.Status.ToString(),
        s.CurrentLocationName,
        s.Weight,
        s.NumberOfPieces,
        s.ServiceType,
        s.ReferenceNumber,
        s.CreatedAt,
        s.EstimatedDelivery,
        s.TrackingEvents.Select(e => new ShipmentEventResponse(
            e.Location, e.Description, e.Status.ToString(), e.Timestamp
        )).ToList()
    );

    public static List<ShipmentResponse> ToResponseList(IEnumerable<Shipment> shipments) =>
        shipments.Select(ToResponse).ToList();

    public static TrackingResponse ToTrackingResponse(Shipment s) => new(
        s.TrackingNumber,
        s.Status.ToString(),
        s.CurrentLocationName,
        s.Origin,
        s.Destination,
        s.CreatedAt,
        s.EstimatedDelivery,
        s.TrackingEvents.Select(e => new ShipmentEventResponse(
            e.Location, e.Description, e.Status.ToString(), e.Timestamp
        )).ToList()
    );

    // Customer mappings
    public static CustomerResponse ToResponse(Customer c) => new(
        c.Id.ToString(),
        c.FirstName,
        c.LastName,
        c.Email,
        c.Phone,
        c.Address,
        c.Role,
        c.CreatedAt
    );

    public static List<CustomerResponse> ToResponseList(IEnumerable<Customer> customers) =>
        customers.Select(ToResponse).ToList();

    // PetShipment mappings
    public static PetShipmentResponse ToResponse(PetShipment p) => new(
        p.Id.ToString(),
        p.TrackingNumber,
        p.OwnerName,
        p.OwnerPhone,
        p.OwnerEmail,
        p.PetName,
        p.PetType.ToString(),
        p.PetBreed,
        p.PetAge,
        p.PetGender,
        p.Weight,
        p.MicrochipId,
        p.PhotoUrl,
        p.Origin,
        p.Destination,
        p.OriginLatitude,
        p.OriginLongitude,
        p.DestinationLatitude,
        p.DestinationLongitude,
        p.CurrentLatitude,
        p.CurrentLongitude,
        p.CurrentLocationName,
        p.JourneyStatus.ToString(),
        p.CreatedAt,
        p.EstimatedDelivery,
        p.VaccinationVerified,
        p.HealthCertificate,
        p.SpecialInstructions,
        p.CustomerVisibleInformation,
        p.CarrierName,
        p.ServiceType,
        p.ShipmentType,
        p.CareEvents.Select(e => new PetCareEventResponse(
            e.Id.ToString(),
            e.LocationName ?? string.Empty,
            e.Description,
            e.Type.ToString(),
            e.CareStatus.ToString(),
            e.EventTime,
            e.Latitude,
            e.Longitude,
            e.CustomerVisible
        )).ToList(),
        p.Documents.Select(d => new PetDocumentResponse(
            d.Id.ToString(),
            d.DocumentNumber,
            d.DocumentType,
            d.FileName,
            d.FileUrl,
            d.ContentType,
            d.FileSize,
            d.Description,
            d.IssuedAt,
            d.CreatedAt,
            d.IsVerified,
            d.CustomerVisible
        )).ToList()
    );

    public static List<PetShipmentResponse> ToResponseList(IEnumerable<PetShipment> pets) =>
        pets.Select(ToResponse).ToList();

    // Office mappings
    public static OfficeResponse ToResponse(Office o) => new(
        o.Id.ToString(),
        o.Name,
        o.Code,
        o.Address,
        o.City,
        o.State,
        o.Country,
        o.Region,
        o.PostalCode,
        o.Latitude,
        o.Longitude,
        o.Phone,
        o.Email,
        o.OpeningHours,
        o.ManagerName,
        o.ManagerPhone,
        o.Type,
        o.IsActive,
        o.CreatedAt,
        o.UpdatedAt
    );

    public static List<OfficeResponse> ToResponseList(IEnumerable<Office> offices) =>
        offices.Select(ToResponse).ToList();

    // Notification mappings
    public static NotificationResponse ToResponse(Notification n) => new(
        n.Id.ToString(),
        n.Type.ToString(),
        n.Title,
        n.Message,
        n.IsRead,
        n.CreatedAt
    );

    public static List<NotificationResponse> ToResponseList(IEnumerable<Notification> notifications) =>
        notifications.Select(ToResponse).ToList();

    // AuditLog mappings
    public static AuditLogResponse ToResponse(AuditLog l) => new(
        l.Id.ToString(),
        l.Action,
        l.ActionType.ToString(),
        l.EntityType,
        l.EntityIdString,
        l.UserIdString,
        l.NewValues,
        l.CreatedAt
    );

    public static List<AuditLogResponse> ToResponseList(IEnumerable<AuditLog> logs) =>
        logs.Select(ToResponse).ToList();
}
