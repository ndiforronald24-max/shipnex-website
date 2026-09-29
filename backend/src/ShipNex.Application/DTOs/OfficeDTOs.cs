using System.ComponentModel.DataAnnotations;

namespace ShipNex.Application.DTOs;

// ---------- Office ----------
public record CreateOfficeRequest(
    [param: Required, StringLength(100)] string Name,
    [param: Required, StringLength(20)] string Code,
    [param: Required, StringLength(200)] string Address,
    [param: StringLength(100)] string? City,
    [param: StringLength(100)] string? State,
    [param: StringLength(100)] string? Country,
    [param: StringLength(50)] string? Region,
    [param: StringLength(20)] string? PostalCode,
    double? Latitude,
    double? Longitude,
    [param: StringLength(30)] string? Phone,
    [param: EmailAddress, StringLength(100)] string? Email,
    [param: StringLength(100)] string? OpeningHours,
    [param: StringLength(100)] string? ManagerName,
    [param: StringLength(30)] string? ManagerPhone,
    [param: StringLength(30)] string? Type
);

public record UpdateOfficeRequest(
    [param: StringLength(100)] string? Name,
    [param: StringLength(200)] string? Address,
    [param: StringLength(100)] string? City,
    [param: StringLength(100)] string? State,
    [param: StringLength(100)] string? Country,
    [param: StringLength(50)] string? Region,
    [param: StringLength(20)] string? PostalCode,
    double? Latitude,
    double? Longitude,
    [param: StringLength(30)] string? Phone,
    [param: EmailAddress, StringLength(100)] string? Email,
    [param: StringLength(100)] string? OpeningHours,
    [param: StringLength(100)] string? ManagerName,
    [param: StringLength(30)] string? ManagerPhone,
    [param: StringLength(30)] string? Type,
    bool? IsActive
);

public record OfficeResponse(
    string Id,
    string Name,
    string Code,
    string Address,
    string? City,
    string? State,
    string? Country,
    string? Region,
    string? PostalCode,
    double? Latitude,
    double? Longitude,
    string? Phone,
    string? Email,
    string? OpeningHours,
    string? ManagerName,
    string? ManagerPhone,
    string Type,
    bool IsActive,
    DateTime CreatedAt,
    DateTime? UpdatedAt
);

// ---------- Notification ----------
public record NotificationResponse(
    string Id,
    string Type,
    string Title,
    string Message,
    bool IsRead,
    DateTime CreatedAt
);

public record CreateNotificationRequest(
    [param: Required, StringLength(50)] string Type,
    [param: Required, StringLength(200)] string Title,
    [param: Required, StringLength(2000)] string Message,
    [param: EmailAddress, StringLength(255)] string? RecipientEmail,
    [param: StringLength(20)] string? RecipientPhone
);

// ---------- Admin ----------
public record AdminStatsResponse(
    int TotalShipments,
    int ActiveShipments,
    int DeliveredShipments,
    int TotalPetShipments,
    int TotalCustomers,
    int TotalOffices,
    int TotalVehicles,
    int UnreadNotifications
);