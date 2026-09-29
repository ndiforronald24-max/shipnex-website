using Microsoft.EntityFrameworkCore;
using ShipNex.Application.DTOs;
using ShipNex.Application.Interfaces;
using ShipNex.Application.Mapping;
using ShipNex.Domain.Entities;
using ShipNex.Domain.Enums;
using ShipNex.Infrastructure.Data;

namespace ShipNex.Infrastructure.Services;

public class AuditService : IAuditService
{
    private readonly ShipNexDbContext _context;

    public AuditService(ShipNexDbContext context)
    {
        _context = context;
    }

    public async Task LogAsync(string action, string actionType, string entityType,
        string? entityId, string? userId, string? details = null, bool isSuccess = true)
    {
        var entry = new AuditLog
        {
            Action = action,
            ActionType = Enum.TryParse<AuditActionType>(actionType, true, out var parsedActionType)
                ? parsedActionType : AuditActionType.Update,
            EntityType = entityType,
            EntityIdString = entityId,
            UserIdString = userId,
            NewValues = details,
            IsSuccess = isSuccess,
            IpAddress = null,
            UserAgent = null
        };

        _context.AuditLogs.Add(entry);
        await _context.SaveChangesAsync();
    }

    public async Task<AuditLogResponse> LogEntryAsync(AuditLog entry)
    {
        _context.AuditLogs.Add(entry);
        await _context.SaveChangesAsync();
        return MappingProfile.ToResponse(entry);
    }

    public async Task<List<AuditLogResponse>> GetRecentAsync(int count = 50)
    {
        var logs = await _context.AuditLogs
            .OrderByDescending(l => l.CreatedAt)
            .Take(count)
            .ToListAsync();
        return logs.Select(MappingProfile.ToResponse).ToList();
    }

    public async Task<List<AuditLogResponse>> GetByUserIdAsync(string userId, int count = 50)
    {
        if (Guid.TryParse(userId, out var guid))
        {
            var logs = await _context.AuditLogs
                .Where(l => l.UserId == guid)
                .OrderByDescending(l => l.CreatedAt)
                .Take(count)
                .ToListAsync();
            return logs.Select(MappingProfile.ToResponse).ToList();
        }
        return new List<AuditLogResponse>();
    }

    public async Task<List<AuditLogResponse>> GetByEntityTypeAsync(string entityType, Guid? entityId = null, int count = 50)
    {
        var query = _context.AuditLogs
            .Where(l => l.EntityType == entityType);

        if (entityId.HasValue)
            query = query.Where(l => l.EntityId == entityId.Value);

        var logs = await query.OrderByDescending(l => l.CreatedAt).Take(count).ToListAsync();
        return logs.Select(MappingProfile.ToResponse).ToList();
    }
}
