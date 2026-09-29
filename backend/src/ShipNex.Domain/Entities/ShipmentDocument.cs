namespace ShipNex.Domain.Entities;

public class ShipmentDocument : BaseEntity
{
    public Guid? ShipmentId { get; set; }
    public Guid? PetShipmentId { get; set; }
    public string DocumentNumber { get; set; } = string.Empty;
    public string DocumentType { get; set; } = string.Empty; // Invoice, PackingList, BillOfLading, etc.
    public string FileName { get; set; } = string.Empty;
    public string FileUrl { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public long FileSize { get; set; }
    public string? Description { get; set; }
    public DateTime? IssuedAt { get; set; }
    public DateTime? ExpiresAt { get; set; }
    public bool IsVerified { get; set; } = false;
    /// <summary>
    /// When true, document metadata may be shown to the public customer on
    /// tracking pages (Health certificate, vaccination record, transport document).
    /// Private veterinary records must remain false.
    /// </summary>
    public bool CustomerVisible { get; set; } = false;

    // Navigation
    public Shipment? Shipment { get; set; }
    public PetShipment? PetShipment { get; set; }
}