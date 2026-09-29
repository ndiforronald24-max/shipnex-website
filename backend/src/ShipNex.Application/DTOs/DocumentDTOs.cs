using System.ComponentModel.DataAnnotations;

namespace ShipNex.Application.DTOs;

/// <summary>
/// Document metadata used by admin/staff endpoints. Matches the ShipmentDocument
/// entity shape (supports both shipment and pet documents).
/// </summary>
public record DocumentResponse(
    string Id,
    string? ShipmentId,
    string? PetShipmentId,
    string DocumentNumber,
    string DocumentType,
    string FileName,
    string FileUrl,
    string ContentType,
    long FileSize,
    string? Description,
    DateTime CreatedAt,
    bool IsVerified,
    bool CustomerVisible
);

public record CreateDocumentRequest(
    [param: Required] string ShipmentId,
    [param: Required, StringLength(100)] string DocumentType,
    [param: Required, StringLength(255)] string FileName,
    [param: StringLength(1000)] string? FileUrl,
    [param: StringLength(100)] string? ContentType,
    long FileSize,
    [param: StringLength(2000)] string? Description,
    DateTime? IssuedAt,
    bool CustomerVisible = false
);

/// <summary>Pet document creation request - owned by a PetShipment.</summary>
public record CreatePetDocumentRequest(
    [param: Required, StringLength(100)] string DocumentType,
    [param: Required, StringLength(255)] string FileName,
    [param: StringLength(1000)] string? FileUrl,
    [param: StringLength(100)] string? ContentType,
    long FileSize,
    [param: StringLength(2000)] string? Description,
    DateTime? IssuedAt,
    bool CustomerVisible = false
);

/// <summary>Toggle customer visibility of an uploaded document.</summary>
public record UpdateDocumentVisibilityRequest(
    bool CustomerVisible
);

/// <summary>Temporary (signed) access URL for a stored document.</summary>
public record DocumentAccessUrlResponse(
    string DocumentId,
    string Url,
    int ExpiresInSeconds,
    DateTime ExpiresAt
);

/// <summary>
/// Customer-safe document entry for the public tracking page. Only documents
/// explicitly marked CustomerVisible are ever mapped to this shape. Storage
/// locations are never exposed: clients download through the anonymous route
/// GET /api/documents/public-file/{Id}, which re-checks visibility on every
/// request.
/// </summary>
public record PublicDocumentResponse(
    string Id,
    string DocumentNumber,
    string DocumentType,
    string FileName,
    string ContentType,
    long FileSize,
    DateTime? IssuedAt
);


/// <summary>Pet document metadata used inside PetShipmentResponse (admin view).</summary>
public record PetDocumentResponse(
    string Id,
    string DocumentNumber,
    string DocumentType,
    string FileName,
    string FileUrl,
    string ContentType,
    long FileSize,
    string? Description,
    DateTime? IssuedAt,
    DateTime CreatedAt,
    bool IsVerified,
    bool CustomerVisible
);