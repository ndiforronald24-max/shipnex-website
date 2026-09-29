using ShipNex.Domain.Enums;

namespace ShipNex.Domain.Entities;

public class NotificationLog : BaseEntity
{
    public Guid NotificationId { get; set; }
    public NotificationChannel Channel { get; set; } = NotificationChannel.Email;
    public string Recipient { get; set; } = string.Empty;
    public string Status { get; set; } = "Pending"; // Pending, Sent, Failed, Delivered
    public string? MessageId { get; set; }
    public string? ErrorMessage { get; set; }
    public DateTime? SentAt { get; set; }
    public DateTime? DeliveredAt { get; set; }

    // Enhanced fields for transactional email tracking
    public string? ShipmentId { get; set; }
    public string? PetShipmentId { get; set; }
    public string Template { get; set; } = string.Empty;
    public string? Subject { get; set; }
    // Html/text bodies captured at send time so RetryFailedNotificationsAsync
    // resends the ORIGINAL template content, not an empty placeholder.
    public string? HtmlBody { get; set; }
    public string? TextBody { get; set; }
    public string? FailureReason { get; set; }
    public int RetryCount { get; set; } = 0;

    // Navigation
    public Notification? Notification { get; set; }
}

public enum NotificationStatus
{
    Pending,
    Sent,
    Failed
}
