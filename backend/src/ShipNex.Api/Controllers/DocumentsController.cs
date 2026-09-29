using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ShipNex.Application.DTOs;
using ShipNex.Application.Interfaces;
using ShipNex.Application.Validation;
using ShipNex.Domain.Entities;
using ShipNex.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace ShipNex.Api.Controllers;

/// <summary>
/// Secure shipment/pet document management backed by private file storage
/// (Supabase Storage when configured, local disk otherwise).
///
/// Security rules enforced here:
/// - Listing/reading requires staff roles; managing requires document-manager roles.
/// - Uploads are validated (type, size, name, MIME) and executables are rejected.
/// - Object storage paths are generated server-side only (no path traversal).
/// - Documents are private by default; only CustomerVisible documents are
///   exposed on public tracking endpoints, and the public download route
///   re-checks the flag on every request.
/// - Every sensitive action writes an audit log entry.
/// </summary>
[ApiController]
[Route("api/documents")]
[Authorize]
public class DocumentsController : ControllerBase
{
    private const string ViewRoles = "SuperAdmin,OperationsManager,ShipmentStaff,PetOperations,CustomerSupport,ReadOnly";
    private const string ManageRoles = "SuperAdmin,OperationsManager,ShipmentStaff,PetOperations";

    private readonly ShipNexDbContext _context;
    private readonly IFileStorageService _storage;
    private readonly IAuditService _auditService;
    private readonly ILogger<DocumentsController> _logger;

    public DocumentsController(ShipNexDbContext context, IFileStorageService storage,
        IAuditService auditService, ILogger<DocumentsController> logger)
    {
        _context = context;
        _storage = storage;
        _auditService = auditService;
        _logger = logger;
    }

    private string GetUserId() => User?.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? string.Empty;

    /// <summary>Extracts the server-generated storage file id from the stored FileUrl.</summary>
    private static string GetStorageFileId(ShipmentDocument doc) => Path.GetFileName(doc.FileUrl);

    private static DocumentResponse ToResponse(ShipmentDocument d) => new(
        d.Id.ToString(),
        d.ShipmentId?.ToString(),
        d.PetShipmentId?.ToString(),
        d.DocumentNumber,
        d.DocumentType,
        d.FileName,
        d.FileUrl,
        d.ContentType,
        d.FileSize,
        d.Description,
        d.CreatedAt,
        d.IsVerified,
        d.CustomerVisible
    );

    /// <summary>Supported document types for the admin upload form.</summary>
    [HttpGet("types")]
    [Authorize(Roles = ViewRoles)]
    public IActionResult GetTypes() => Ok(new
    {
        types = DocumentUploadValidator.DocumentTypes,
        sensitivePetTypes = DocumentUploadValidator.SensitivePetDocumentTypes,
        maxFileSizeBytes = DocumentUploadValidator.MaxFileSizeBytes,
        allowedExtensions = DocumentUploadValidator.AllowedExtensions,
    });

    [HttpGet("shipment/{shipmentId}")]
    [Authorize(Roles = ViewRoles)]
    public async Task<IActionResult> GetByShipment(string shipmentId)
    {
        if (!Guid.TryParse(shipmentId, out var guid)) return BadRequest(new { message = "Invalid shipment id" });

        var docs = await _context.ShipmentDocuments
            .Where(d => d.ShipmentId == guid && !d.IsDeleted)
            .OrderByDescending(d => d.CreatedAt)
            .ToListAsync();

        return Ok(docs.Select(ToResponse));
    }

    [HttpGet("pet/{petId}")]
    [Authorize(Roles = ViewRoles)]
    public async Task<IActionResult> GetByPet(string petId)
    {
        if (!Guid.TryParse(petId, out var guid)) return BadRequest(new { message = "Invalid pet id" });

        var docs = await _context.ShipmentDocuments
            .Where(d => d.PetShipmentId == guid && !d.IsDeleted)
            .OrderByDescending(d => d.CreatedAt)
            .ToListAsync();

        return Ok(docs.Select(ToResponse));
    }

    /// <summary>
    /// Uploads a document file to private storage and records its metadata.
    /// Multipart form fields: shipmentId (or petShipmentId), documentType,
    /// description, customerVisible; plus the binary "file" part.
    /// </summary>
    [HttpPost("upload")]
    [Authorize(Roles = ManageRoles)]
    [RequestSizeLimit(DocumentUploadValidator.MaxFileSizeBytes + 64 * 1024)]
    public async Task<IActionResult> Upload([FromForm] IFormFile file, [FromForm] string? shipmentId,
        [FromForm] string? petShipmentId, [FromForm] string documentType,
        [FromForm] string? description, [FromForm] bool customerVisible = false)
    {
        if (file == null || file.Length == 0)
            return BadRequest(new { message = "A file is required." });

        var hasShipment = Guid.TryParse(shipmentId, out var shipmentGuid);
        var hasPet = Guid.TryParse(petShipmentId, out var petGuid);
        if (!hasShipment && !hasPet)
            return BadRequest(new { message = "A valid shipmentId or petShipmentId is required." });

        if (!DocumentUploadValidator.IsSupportedDocumentType(documentType))
            return BadRequest(new { message = $"Document type '{documentType}' is not supported. Supported types: {string.Join(", ", DocumentUploadValidator.DocumentTypes)}." });

        Shipment? shipment = null;
        PetShipment? pet = null;
        if (hasShipment)
        {
            shipment = await _context.Shipments.FindAsync(shipmentGuid);
            if (shipment == null) return NotFound(new { message = "Shipment not found" });
        }
        else
        {
            pet = await _context.PetShipments.FindAsync(petGuid);
            if (pet == null) return NotFound(new { message = "Pet shipment not found" });
        }

        // Validate and sanitize everything the client supplied.
        var safeFileName = DocumentUploadValidator.SanitizeFileName(file.FileName);
        var fileCheck = DocumentUploadValidator.ValidateFile(safeFileName, file.ContentType, file.Length);
        if (!fileCheck.IsValid)
        {
            await _auditService.LogAsync(
                $"Rejected document upload '{file.FileName}' for shipment {shipmentId}{petShipmentId}: {fileCheck.Error}",
                "Create", "ShipmentDocument", null, GetUserId(), fileCheck.Error, isSuccess: false);
            return BadRequest(new { message = fileCheck.Error });
        }

        // Upload to private storage — the physical path is generated server-side.
        string fileId;
        try
        {
            await using var stream = file.OpenReadStream();
            fileId = await _storage.UploadAsync(stream, safeFileName!, file.ContentType);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }

        var doc = new ShipmentDocument
        {
            ShipmentId = hasShipment ? shipmentGuid : null,
            PetShipmentId = hasPet ? petGuid : null,
            DocumentNumber = $"DOC-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString("N")[..6].ToUpper()}",
            DocumentType = documentType,
            FileName = safeFileName!,
            FileUrl = _storage.GetFileUrl(fileId),
            ContentType = file.ContentType,
            FileSize = file.Length,
            Description = description,
            IssuedAt = DateTime.UtcNow,
            IsVerified = true,
            CustomerVisible = customerVisible
        };

        _context.ShipmentDocuments.Add(doc);
        await _context.SaveChangesAsync();

        await _auditService.LogAsync(
            $"Uploaded document {doc.DocumentNumber} ({documentType}) '{safeFileName}' ({file.Length} bytes) " +
            $"for {(hasShipment ? "shipment " + shipment!.TrackingNumber : "pet " + pet!.TrackingNumber)}. CustomerVisible={customerVisible}",
            "Create", "ShipmentDocument", doc.Id.ToString(), GetUserId());

        return CreatedAtAction(nameof(GetByShipment), new { shipmentId = shipmentId ?? string.Empty }, ToResponse(doc));
    }

    /// <summary>Streams the file through the API (staff only, audited).</summary>
    [HttpGet("{id}/download")]
    [Authorize(Roles = ViewRoles)]
    public async Task<IActionResult> Download(string id)
    {
        if (!Guid.TryParse(id, out var guid)) return BadRequest(new { message = "Invalid id" });
        var doc = await _context.ShipmentDocuments.FirstOrDefaultAsync(d => d.Id == guid && !d.IsDeleted);
        if (doc == null) return NotFound(new { message = "Document not found" });

        try
        {
            var stream = await _storage.DownloadAsync(GetStorageFileId(doc));
            await _auditService.LogAsync($"Downloaded document {doc.DocumentNumber} ('{doc.FileName}')",
                "Read", "ShipmentDocument", doc.Id.ToString(), GetUserId());
            return File(stream, doc.ContentType, doc.FileName);
        }
        catch (FileNotFoundException)
        {
            return NotFound(new { message = "Stored file could not be found." });
        }
    }

    /// <summary>
    /// Creates a short-lived secure access URL (signed URL for private
    /// Supabase Storage, authorized API route for local storage).
    /// Expiry is bounded between 1 minute and 1 hour.
    /// </summary>
    [HttpGet("{id}/access-url")]
    [Authorize(Roles = ViewRoles)]
    public async Task<IActionResult> GetAccessUrl(string id, [FromQuery] int expiresInSeconds = 300)
    {
        if (!Guid.TryParse(id, out var guid)) return BadRequest(new { message = "Invalid id" });
        var doc = await _context.ShipmentDocuments.FirstOrDefaultAsync(d => d.Id == guid && !d.IsDeleted);
        if (doc == null) return NotFound(new { message = "Document not found" });

        var expiry = Math.Clamp(expiresInSeconds, 60, 3600);
        string url;
        try
        {
            url = await _storage.CreateTemporaryAccessUrlAsync(GetStorageFileId(doc), expiry);
        }
        catch (FileNotFoundException)
        {
            return NotFound(new { message = "Stored file could not be found." });
        }

        await _auditService.LogAsync(
            $"Issued temporary access URL for document {doc.DocumentNumber} (expires in {expiry}s)",
            "Read", "ShipmentDocument", doc.Id.ToString(), GetUserId());

        return Ok(new DocumentAccessUrlResponse(doc.Id.ToString(), url, expiry, DateTime.UtcNow.AddSeconds(expiry)));
    }

    /// <summary>Updates customer visibility (audited).</summary>
    [HttpPatch("{id}/visibility")]
    [Authorize(Roles = ManageRoles)]
    public async Task<IActionResult> SetVisibility(string id, [FromBody] UpdateDocumentVisibilityRequest request)
    {
        if (!Guid.TryParse(id, out var guid)) return BadRequest(new { message = "Invalid id" });
        var doc = await _context.ShipmentDocuments.FirstOrDefaultAsync(d => d.Id == guid && !d.IsDeleted);
        if (doc == null) return NotFound(new { message = "Document not found" });

        var previous = doc.CustomerVisible;
        doc.CustomerVisible = request.CustomerVisible;
        doc.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        await _auditService.LogAsync(
            $"Set customer visibility of document {doc.DocumentNumber} ({doc.DocumentType}): {previous} → {request.CustomerVisible}",
            "Update", "ShipmentDocument", doc.Id.ToString(), GetUserId(),
            details: request.CustomerVisible
                ? "Document is now visible to customers on public tracking."
                : "Document hidden from customers.");

        return Ok(ToResponse(doc));
    }

    /// <summary>Soft-deletes the metadata and removes the stored file (audited).</summary>
    [HttpDelete("{id}")]
    [Authorize(Roles = ManageRoles)]
    public async Task<IActionResult> Delete(string id)
    {
        if (!Guid.TryParse(id, out var guid)) return BadRequest(new { message = "Invalid id" });
        var doc = await _context.ShipmentDocuments.FirstOrDefaultAsync(d => d.Id == guid && !d.IsDeleted);
        if (doc == null) return NotFound(new { message = "Document not found" });

        doc.IsDeleted = true;
        doc.DeletedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        var fileRemoved = await _storage.DeleteAsync(GetStorageFileId(doc));

        await _auditService.LogAsync(
            $"Deleted document {doc.DocumentNumber} ({doc.DocumentType}) '{doc.FileName}'" +
            (fileRemoved ? " including the stored file." : " (metadata deleted; stored file removal failed or was not found)."),
            "Delete", "ShipmentDocument", doc.Id.ToString(), GetUserId(), isSuccess: fileRemoved);

        return NoContent();
    }

    // ---------- Public (customer) access ----------

    /// <summary>
    /// Documents for the public tracking page, by tracking number. ONLY
    /// documents explicitly marked CustomerVisible are returned — veterinary,
    /// health and vaccination records stay private unless a staff member
    /// explicitly flagged them customer-visible. No storage location of any
    /// kind is exposed; the file itself is served by the anonymous
    /// public-file endpoint, which re-checks visibility.
    /// </summary>
    [HttpGet("public/{trackingNumber}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetPublicDocuments(string trackingNumber)
    {
        if (string.IsNullOrWhiteSpace(trackingNumber) || trackingNumber.Length > 64)
            return NotFound(new { message = "No documents found for this tracking number." });

        var normalized = trackingNumber.Trim().ToUpperInvariant();
        var docs = await _context.ShipmentDocuments
            .Where(d => !d.IsDeleted && d.CustomerVisible &&
                ((d.Shipment != null && d.Shipment.TrackingNumber == normalized) ||
                 (d.PetShipment != null && d.PetShipment.TrackingNumber == normalized)))
            .OrderByDescending(d => d.CreatedAt)
            .ToListAsync();

        var result = docs.Select(d => new PublicDocumentResponse(
            d.Id.ToString(),
            d.DocumentNumber,
            d.DocumentType,
            d.FileName,
            d.ContentType,
            d.FileSize,
            d.IssuedAt
        ));

        await _auditService.LogAsync(
            $"Public tracking document list accessed for '{normalized}' ({docs.Count} visible)",
            "Read", "ShipmentDocument", null, GetUserId());

        return Ok(result);
    }

    /// <summary>
    /// Anonymous download of a single document, permitted ONLY when the
    /// document is explicitly CustomerVisible. This is the public tracking
    /// file route; it re-checks the flag on every request.
    /// </summary>
    [HttpGet("public-file/{id}")]
    [AllowAnonymous]
    public async Task<IActionResult> DownloadPublic(string id)
    {
        if (!Guid.TryParse(id, out var guid)) return NotFound(new { message = "Document not found." });

        var doc = await _context.ShipmentDocuments
            .FirstOrDefaultAsync(d => d.Id == guid && !d.IsDeleted);

        // The visibility gate: no CustomerVisible flag → no public access, ever.
        if (doc == null || !doc.CustomerVisible)
        {
            await _auditService.LogAsync(
                $"Blocked public access attempt to non-customer-visible document '{id}'",
                "Read", "ShipmentDocument", id, GetUserId(), isSuccess: false);
            return NotFound(new { message = "Document not found." });
        }

        try
        {
            var stream = await _storage.DownloadAsync(GetStorageFileId(doc));
            await _auditService.LogAsync(
                $"Public download of customer-visible document {doc.DocumentNumber} ('{doc.FileName}')",
                "Read", "ShipmentDocument", doc.Id.ToString(), GetUserId());
            return File(stream, doc.ContentType, doc.FileName);
        }
        catch (FileNotFoundException)
        {
            return NotFound(new { message = "Document not found." });
        }
    }
}
