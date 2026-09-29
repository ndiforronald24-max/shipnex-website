namespace ShipNex.Application.DTOs;

/// <summary>Audit log response DTO.</summary>
public record AuditLogResponse(
    string Id,
    string Action,
    string ActionType,
    string EntityType,
    string? EntityId,
    string? UserId,
    string? Details,
    DateTime CreatedAt
);