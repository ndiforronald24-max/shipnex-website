using ShipNex.Domain.Enums;

namespace ShipNex.Domain.Entities;

public class Notification : BaseEntity
{
    public Guid? UserId { get; set; }
    public Guid? CustomerId { get; set; }
    public Guid? ShipmentId { get; set; }
    public Guid? PetShipmentId { get; set; }
    public NotificationType Type { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public bool IsRead { get; set; } = false;
    public DateTime? ReadAt { get; set; }
    public string? RecipientEmail { get; set; }
    public string? RecipientPhone { get; set; }
    public bool SentSuccessfully { get; set; } = false;
    public string? ErrorMessage { get; set; }

    // Navigation
    public User? User { get; set; }
    public Customer? Customer { get; set; }
    public Shipment? Shipment { get; set; }
    public PetShipment? PetShipment { get; set; }
    public ICollection<NotificationLog> Logs { get; set; } = new List<NotificationLog>();
}