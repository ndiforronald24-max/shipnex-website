using ShipNex.Application.DTOs;
using ShipNex.Application.Mapping;
using ShipNex.Domain.Entities;

namespace ShipNex.Application.Interfaces;

public interface IAuditService
{
    Task LogAsync(string action, string actionType, string entityType,
        string? entityId, string? userId, string? details = null, bool isSuccess = true);
    Task<AuditLogResponse> LogEntryAsync(AuditLog entry);
    Task<List<AuditLogResponse>> GetRecentAsync(int count = 50);
    Task<List<AuditLogResponse>> GetByUserIdAsync(string userId, int count = 50);
    Task<List<AuditLogResponse>> GetByEntityTypeAsync(string entityType, Guid? entityId = null, int count = 50);
}
