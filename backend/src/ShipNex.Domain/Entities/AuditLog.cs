using ShipNex.Domain.Enums;

namespace ShipNex.Domain.Entities;

public class AuditLog : BaseEntity
{
    public Guid? UserId { get; set; }
    public string? UserIdString { get; set; }
    public string Action { get; set; } = string.Empty;
    public AuditActionType ActionType { get; set; }
    public string EntityType { get; set; } = string.Empty;
    public Guid? EntityId { get; set; }
    public string? EntityIdString { get; set; }
    public string? OldValues { get; set; }
    public string? NewValues { get; set; }
    public string? IpAddress { get; set; }
    public string? UserAgent { get; set; }
    public bool IsSuccess { get; set; } = true;
    public string? ErrorMessage { get; set; }
    public string? CorrelationId { get; set; }

    // Navigation
    public User? User { get; set; }
}