using ShipNex.Application.DTOs;

namespace ShipNex.Application.Interfaces;

public interface INotificationService
{
    Task<NotificationResponse> CreateAsync(CreateNotificationRequest request);
    Task<NotificationResponse?> GetByIdAsync(string id);
    Task<List<NotificationResponse>> GetAllAsync(string? userId = null);
    Task<int> GetUnreadCountAsync(string? userId = null);
    Task<bool> MarkAsReadAsync(string id);
    Task<bool> MarkAllAsReadAsync(string? userId = null);
    Task SendShipmentNotificationAsync(string shipmentId, string type, string title, string message);
}
