using Microsoft.EntityFrameworkCore;
using ShipNex.Application.DTOs;
using ShipNex.Application.Interfaces;
using ShipNex.Application.Mapping;
using ShipNex.Domain.Entities;
using ShipNex.Domain.Enums;
using ShipNex.Infrastructure.Data;

namespace ShipNex.Infrastructure.Services;

public class NotificationService : INotificationService
{
    private readonly ShipNexDbContext _context;
    private readonly IEmailNotificationService? _emailNotification;

    public NotificationService(ShipNexDbContext context, IEmailNotificationService? emailNotification = null)
    {
        _context = context;
        _emailNotification = emailNotification;
    }

    public async Task<NotificationResponse> CreateAsync(CreateNotificationRequest request)
    {
        var notification = new Notification
        {
            Type = Enum.TryParse<NotificationType>(request.Type, true, out var parsedType)
                ? parsedType
                : NotificationType.ShipmentStatusUpdate,
            Title = request.Title,
            Message = request.Message,
            RecipientEmail = request.RecipientEmail,
            RecipientPhone = request.RecipientPhone
        };

        _context.Notifications.Add(notification);
        await _context.SaveChangesAsync();
        return MappingProfile.ToResponse(notification);
    }

    public async Task<NotificationResponse?> GetByIdAsync(string id)
    {
        if (!Guid.TryParse(id, out var guid)) return null;
        var notification = await _context.Notifications.FindAsync(guid);
        return notification == null ? null : MappingProfile.ToResponse(notification);
    }

    public async Task<List<NotificationResponse>> GetAllAsync(string? userId = null)
    {
        var query = _context.Notifications.AsQueryable();

        if (!string.IsNullOrWhiteSpace(userId) && Guid.TryParse(userId, out var guid))
            query = query.Where(n => n.UserId == guid);

        var notifications = await query
            .OrderByDescending(n => n.CreatedAt)
            .ToListAsync();
        return notifications.Select(MappingProfile.ToResponse).ToList();
    }

    public async Task<int> GetUnreadCountAsync(string? userId = null)
    {
        var query = _context.Notifications.Where(n => !n.IsRead);
        if (!string.IsNullOrWhiteSpace(userId) && Guid.TryParse(userId, out var guid))
            query = query.Where(n => n.UserId == guid);
        return await query.CountAsync();
    }

    public async Task<bool> MarkAsReadAsync(string id)
    {
        if (!Guid.TryParse(id, out var guid)) return false;
        var notification = await _context.Notifications.FindAsync(guid);
        if (notification == null) return false;

        notification.IsRead = true;
        notification.ReadAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> MarkAllAsReadAsync(string? userId = null)
    {
        IQueryable<Notification> query;
        if (!string.IsNullOrWhiteSpace(userId) && Guid.TryParse(userId, out var guid))
            query = _context.Notifications.Where(n => !n.IsRead && n.UserId == guid);
        else
            query = _context.Notifications.Where(n => !n.IsRead);

        var notifications = await query.ToListAsync();
        foreach (var n in notifications)
        {
            n.IsRead = true;
            n.ReadAt = DateTime.UtcNow;
        }
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task SendShipmentNotificationAsync(string shipmentId, string type, string title, string message)
    {
        if (Guid.TryParse(shipmentId, out var guid))
        {
            var notification = new Notification
            {
                Type = Enum.TryParse<NotificationType>(type, true, out var parsedType)
                    ? parsedType
                    : NotificationType.ShipmentStatusUpdate,
                Title = title,
                Message = message,
                ShipmentId = guid,
                SentSuccessfully = false
            };
            _context.Notifications.Add(notification);
            await _context.SaveChangesAsync();

            // Also send email notification if service is available
            if (_emailNotification != null)
            {
                try
                {
                    var templateName = type switch
                    {
                        "ShipmentCreated" => "ShipmentCreated",
                        "PickedUp" => "ShipmentPickedUp",
                        "DepartedOrigin" => "ShipmentDeparted",
                        "InTransit" => "ShipmentInTransit",
                        "ImportCustoms" or "ExportCustoms" => "CustomsUpdate",
                        "ArrivedAtDestination" => "ShipmentArrived",
                        "OutForDelivery" => "OutForDelivery",
                        "Delivered" => "Delivered",
                        "Delayed" => "Delayed",
                        "Exception" => "Exception",
                        _ => "ShipmentCreated"
                    };

                    var result = await _emailNotification.SendShipmentNotificationAsync(shipmentId, templateName);
                    notification.SentSuccessfully = result.Success;
                }
                catch (Exception)
                {
                    notification.SentSuccessfully = false;
                }
                await _context.SaveChangesAsync();
            }
        }
    }
}
