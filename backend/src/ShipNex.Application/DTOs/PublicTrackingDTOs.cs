using System.ComponentModel.DataAnnotations;

namespace ShipNex.Application.DTOs;

/// <summary>
/// Customer-safe tracking event. Never includes internal Notes.
/// </summary>
public record PublicTrackingEventResponse(
    string Status,
    string LocationName,
    string? Description,
    DateTime EventTime,
    double? Latitude,
    double? Longitude
);

/// <summary>
/// Customer-visible document metadata only. No file bytes, no internal flags.
/// Only verified documents are ever returned publicly.
/// </summary>
public record PublicTrackingDocumentResponse(
    string DocumentNumber,
    string DocumentType,
    string FileName,
    long FileSize,
    DateTime? IssuedAt
);

/// <summary>
/// Customer-safe shipment tracking response for GET /api/tracking/{trackingNumber}.
/// Excludes: sender/receiver names, addresses, phones, internal notes,
/// staff details, audit logs, customer private fields.
/// </summary>
public record PublicShipmentTrackingResponse(
    string TrackingNumber,
    string Status,
    string Origin,
    double? OriginLatitude,
    double? OriginLongitude,
    string Destination,
    double? DestinationLatitude,
    double? DestinationLongitude,
    string CurrentLocationName,
    double? CurrentLatitude,
    double? CurrentLongitude,
    DateTime? EstimatedDelivery,
    string ShipmentType,
    string ServiceType,
    double Weight,
    int NumberOfPieces,
    string? ReferenceNumber,
    DateTime LastUpdated,
    List<PublicTrackingEventResponse> Timeline,
    List<PublicTrackingDocumentResponse> Documents
);

public record PublicPetTrackingEventResponse(
    string StatusName,
    string LocationName,
    string? Description,
    DateTime EventTime
);

/// <summary>
/// Customer-visible care event. Only customer-visible events appear here.
/// Never includes internal notes.
/// </summary>
public record PublicPetCareEventResponse(
    string EventType,
    string Status,
    string? Description,
    string LocationName,
    DateTime EventTime
);

/// <summary>
/// Customer-safe pet tracking response. Excludes owner contact details,
/// special instructions, carrier internals and private veterinary notes.
/// Only includes customer-visible care events and documents.
/// </summary>
public record PublicPetTrackingResponse(
    string TrackingNumber,
    string Status,
    string PetName,
    string PetType,
    string? PetBreed,
    int? PetAge,
    string? PetGender,
    double? Weight,
    string? MicrochipId,
    string? PhotoUrl,
    string Origin,
    double? OriginLatitude,
    double? OriginLongitude,
    string Destination,
    double? DestinationLatitude,
    double? DestinationLongitude,
    string CurrentLocationName,
    double? CurrentLatitude,
    double? CurrentLongitude,
    DateTime? EstimatedDelivery,
    DateTime LastUpdated,
    List<PublicTrackingEventResponse> Timeline,
    List<PublicPetCareEventResponse> CareEvents,
    List<PublicTrackingDocumentResponse> Documents
);

/// <summary>
/// Unified public tracking envelope. Type is "shipment" or "pet".
/// </summary>
public record PublicTrackingEnvelope(
    string Type,
    object Result
);
