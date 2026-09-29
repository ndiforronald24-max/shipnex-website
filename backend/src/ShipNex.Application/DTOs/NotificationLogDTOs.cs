namespace ShipNex.Application.DTOs;

public class NotificationLogDto
{
    public Guid Id { get; set; }
    public Guid NotificationId { get; set; }
    public string Channel { get; set; } = string.Empty;
    public string Recipient { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string? MessageId { get; set; }
    public string? FailureReason { get; set; }
    public int RetryCount { get; set; } = 0;
    public string Template { get; set; } = string.Empty;
    public string? Subject { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? SentAt { get; set; }
    public DateTime? DeliveredAt { get; set; }
}

public class NotificationLogDetailDto
{
    public Guid Id { get; set; }
    public string Template { get; set; } = string.Empty;
    public string Channel { get; set; } = string.Empty;
    public string Recipient { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string? Subject { get; set; }
    public string? HtmlBody { get; set; }
    public string? TextBody { get; set; }
    public string? MessageId { get; set; }
    public string? FailureReason { get; set; }
    public int RetryCount { get; set; }
    public Guid? ShipmentId { get; set; }
    public string? ShipmentTrackingNumber { get; set; }
    public string? CustomerName { get; set; }
    public string? CustomerEmail { get; set; }
    public Guid? PetShipmentId { get; set; }
    public string? PetShipmentTrackingNumber { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? SentAt { get; set; }
    public DateTime? DeliveredAt { get; set; }
}

public class NotificationStatsDto
{
    public int Total { get; set; }
    public int Sent { get; set; }
    public int Pending { get; set; }
    public int Failed { get; set; }
    public int Retried { get; set; }
}

public class PagedNotificationLogResponse
{
    public List<NotificationLogDto> Items { get; set; } = new();
    public int TotalCount { get; set; }
    public int PageNumber { get; set; }
    public int PageSize { get; set; }
    public int TotalPages => (int)Math.Ceiling((double)TotalCount / PageSize);
}