using System.Text;

namespace ShipNex.Application.Validation;

/// <summary>
/// Result of validating an upload request against the shipment-document rules.
/// </summary>
public record DocumentValidationResult(bool IsValid, string Error)
{
    public static readonly DocumentValidationResult Ok = new(true, string.Empty);
    public static DocumentValidationResult Fail(string error) => new(false, error);
}

/// <summary>
/// Central validation for shipment document uploads:
/// - document type must be one of the supported types
/// - file name must be safe (no path traversal, no control chars, bounded length)
/// - extension + MIME type must be on the allow-list and agree with each other
/// - executables / scripts are always rejected regardless of claimed MIME type
/// - file size is bounded
/// Storage keys are always generated server-side; the client file name is only
/// ever stored as display metadata, so a hostile name can never influence the
/// physical storage path.
/// </summary>
public static class DocumentUploadValidator
{
    /// <summary>Canonical document types supported by ShipNex.</summary>
    public static readonly IReadOnlyList<string> DocumentTypes = new[]
    {
        "Invoice",
        "ShippingDocument",
        "CustomsDocument",
        "DeliveryConfirmation",
        "HealthCertificate",
        "VaccinationRecord",
        "VeterinaryDocument",
        "TransportDocument",
        // Legacy types kept for backwards compatibility with existing records.
        "PackingList",
        "BillOfLading",
        "CustomsDeclaration",
        "Other",
    };

    /// <summary>Sensitive pet/veterinary document types. They are NEVER exposed
    /// publicly unless CustomerVisible is explicitly true (enforced in queries).</summary>
    public static readonly IReadOnlyList<string> SensitivePetDocumentTypes = new[]
    {
        "HealthCertificate", "VaccinationRecord", "VeterinaryDocument",
    };

    /// <summary>Extensions that must never be uploaded, even if the claimed
    /// content type looks benign.</summary>
    public static readonly IReadOnlySet<string> BlockedExtensions = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
    {
        ".exe", ".dll", ".bat", ".cmd", ".com", ".scr", ".msi", ".msp", ".mst",
        ".ps1", ".psm1", ".sh", ".bash", ".vbs", ".vbe", ".js", ".jse", ".wsf",
        ".wsh", ".hta", ".jar", ".apk", ".app", ".deb", ".rpm", ".reg", ".lnk",
        ".cpl", ".pif", ".gadget", ".py", ".rb", ".pl", ".php", ".aspx", ".jsp",
    };

    /// <summary>Extensions accepted for documents (no executables, no scripts).</summary>
    public static readonly IReadOnlySet<string> AllowedExtensions = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
    {
        ".pdf", ".png", ".jpg", ".jpeg", ".webp", ".gif",
        ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx",
        ".txt", ".csv",
    };

    /// <summary>MIME types accepted, mapped from their canonical extensions.</summary>
    private static readonly Dictionary<string, string> AllowedMimeByExtension =
        new(StringComparer.OrdinalIgnoreCase)
        {
            [".pdf"] = "application/pdf",
            [".png"] = "image/png",
            [".jpg"] = "image/jpeg",
            [".jpeg"] = "image/jpeg",
            [".webp"] = "image/webp",
            [".gif"] = "image/gif",
            [".doc"] = "application/msword",
            [".docx"] = "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            [".xls"] = "application/vnd.ms-excel",
            [".xlsx"] = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            [".ppt"] = "application/vnd.ms-powerpoint",
            [".pptx"] = "application/vnd.openxmlformats-officedocument.presentationml.presentation",
            [".txt"] = "text/plain",
            [".csv"] = "text/csv",
        };

    public const long MaxFileSizeBytes = 10 * 1024 * 1024; // 10 MB

    public static bool IsSupportedDocumentType(string documentType) =>
        DocumentTypes.Contains(documentType, StringComparer.OrdinalIgnoreCase);

    /// <summary>
    /// Sanitizes a client-supplied file name for display/storage metadata:
    /// strips any path components (both / and \, preventing traversal),
    /// control characters and reserved names, and bounds the length.
    /// Returns null when nothing safe remains.
    /// </summary>
    public static string? SanitizeFileName(string? fileName)
    {
        if (string.IsNullOrWhiteSpace(fileName)) return null;

        // Take only the final path segment for both separators.
        var name = fileName.Replace('\\', '/');
        var lastSlash = name.LastIndexOf('/');
        if (lastSlash >= 0) name = name[(lastSlash + 1)..];

        // Remove control characters and other unsafe chars.
        var sb = new StringBuilder(name.Length);
        foreach (var ch in name)
        {
            if (char.IsControl(ch)) continue;
            if (ch is '<' or '>' or ':' or '"' or '|' or '?' or '*' or '\0') continue;
            sb.Append(ch);
        }
        name = sb.ToString().Trim(' ', '.');

        // Reserved Windows device names.
        var stem = name.Split('.')[0].ToUpperInvariant();
        if (stem is "CON" or "PRN" or "AUX" or "NUL"
            or "COM1" or "COM2" or "COM3" or "COM4" or "COM5" or "COM6" or "COM7" or "COM8" or "COM9"
            or "LPT1" or "LPT2" or "LPT3" or "LPT4" or "LPT5" or "LPT6" or "LPT7" or "LPT8" or "LPT9")
        {
            return null;
        }

        if (name.Length == 0 || name.Equals("..", StringComparison.Ordinal) || name.Equals(".", StringComparison.Ordinal))
            return null;

        if (name.Length > 255) name = name[^255..];
        return name;
    }

    /// <summary>
    /// Validates extension, MIME type, their agreement, and size.
    /// fileName must already be sanitized (see <see cref="SanitizeFileName"/>).
    /// </summary>
    public static DocumentValidationResult ValidateFile(string? sanitizedFileName, string? contentType, long fileSize)
    {
        if (string.IsNullOrWhiteSpace(sanitizedFileName))
            return DocumentValidationResult.Fail("File name is required.");

        if (fileSize <= 0)
            return DocumentValidationResult.Fail("File must not be empty.");

        if (fileSize > MaxFileSizeBytes)
            return DocumentValidationResult.Fail($"File exceeds the maximum allowed size of {MaxFileSizeBytes / (1024 * 1024)} MB.");

        var extension = Path.GetExtension(sanitizedFileName);
        if (string.IsNullOrEmpty(extension))
            return DocumentValidationResult.Fail("File must have an extension.");

        if (BlockedExtensions.Contains(extension))
            return DocumentValidationResult.Fail($"Executable and script files ('{extension}') are not allowed.");

        if (!AllowedExtensions.Contains(extension))
            return DocumentValidationResult.Fail($"File type '{extension}' is not allowed. Allowed: pdf, images, Office documents, txt, csv.");

        var expectedMime = AllowedMimeByExtension[extension.ToLowerInvariant()];
        if (string.IsNullOrWhiteSpace(contentType))
            return DocumentValidationResult.Fail("Content type is required.");

        // Strip parameters such as "; charset=binary" before comparing.
        var claimedMime = contentType.Split(';')[0].Trim();
        if (!expectedMime.Equals(claimedMime, StringComparison.OrdinalIgnoreCase))
            return DocumentValidationResult.Fail($"Content type '{claimedMime}' does not match file extension '{extension}'.");

        return DocumentValidationResult.Ok;
    }
}
