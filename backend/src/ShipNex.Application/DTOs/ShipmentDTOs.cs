using System.ComponentModel.DataAnnotations;

namespace ShipNex.Application.DTOs;

public record CreateShipmentRequest(
    [param: Required, StringLength(100)] string SenderName,
    [param: Required, StringLength(200)] string SenderAddress,
    [param: Required, StringLength(100)] string ReceiverName,
    [param: Required, StringLength(200)] string ReceiverAddress,
    [param: Required, StringLength(100)] string Origin,
    [param: Required, StringLength(100)] string Destination,
    [param: Range(0.01, 99999.99)] double Weight,
    [param: Range(1, 10000)] int NumberOfPieces,
    [param: Required, StringLength(50)] string ServiceType,
    [param: StringLength(50)] string? ShipmentType,
    [param: StringLength(100)] string? ReferenceNumber,
    DateTime? EstimatedDelivery,
    [param: StringLength(500)] string? Notes,
    Guid? CustomerId = null,
    // Optional map coordinates. The entity has always had these columns; nothing
    // ever populated them, so the origin/destination markers on the tracking map
    // could never render. Latitude is -90..90, longitude -180..180.
    [param: Range(-90, 90)] double? OriginLatitude = null,
    [param: Range(-180, 180)] double? OriginLongitude = null,
    [param: Range(-90, 90)] double? DestinationLatitude = null,
    [param: Range(-180, 180)] double? DestinationLongitude = null
);

public record UpdateShipmentStatusRequest(
    [param: Required, StringLength(50)] string Status,
    [param: Required, StringLength(100)] string Location,
    [param: StringLength(2000)] string? Description
);

public record AddTrackingEventRequest(
    [param: Required, StringLength(50)] string Status,
    [param: Required, StringLength(200)] string LocationName,
    double? Latitude,
    double? Longitude,
    [param: StringLength(2000)] string? Description,
    DateTime? EventTime
);

public record ShipmentFilterRequest(
    string? TrackingNumber,
    string? CustomerId,
    string? Status,
    string? Origin,
    string? Destination,
    DateTime? FromDate,
    DateTime? ToDate,
    int Page = 1,
    int PageSize = 20
);

public record ShipmentResponse(
    string Id,
    string TrackingNumber,
    string SenderName,
    string ReceiverName,
    string Origin,
    string Destination,
    string Status,
    string CurrentLocation,
    double Weight,
    int NumberOfPieces,
    string ServiceType,
    string? ReferenceNumber,
    DateTime CreatedAt,
    DateTime? EstimatedDelivery,
    List<ShipmentEventResponse> Events,
    string? CustomerId = null
);

public record ShipmentEventResponse(
    string Location,
    string Description,
    string Status,
    DateTime Timestamp
);

public record TrackingResponse(
    string TrackingNumber,
    string Status,
    string CurrentLocation,
    string Origin,
    string Destination,
    DateTime CreatedAt,
    DateTime? EstimatedDelivery,
    List<ShipmentEventResponse> Events
);

public record PagedResponse<T>(
    List<T> Items,
    int TotalCount,
    int Page,
    int PageSize,
    int TotalPages
);
