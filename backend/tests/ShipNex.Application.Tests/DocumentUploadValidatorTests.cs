using ShipNex.Application.Validation;
using Xunit;

namespace ShipNex.Application.Tests;

/// <summary>
/// Security tests for shipment document upload validation:
/// path traversal, executable rejection, MIME/extension agreement, size caps,
/// and the supported document-type list.
/// </summary>
public class DocumentUploadValidatorTests
{
    // ---------- File name sanitization (path traversal) ----------

    [Theory]
    [InlineData("../../../../etc/passwd")]
    [InlineData("..\\..\\..\\windows\\system32\\config")]
    [InlineData("invoices/../../../secret.pdf")]
    [InlineData("C:\\Users\\victim\\secret.pdf")]
    [InlineData("/etc/shadow")]
    public void SanitizeFileName_StripsPathComponents_PreventingTraversal(string hostile)
    {
        var result = DocumentUploadValidator.SanitizeFileName(hostile);

        // Whatever survives must contain no path separators or parent references.
        Assert.DoesNotContain("/", result ?? string.Empty);
        Assert.DoesNotContain("\\", result ?? string.Empty);
        Assert.DoesNotContain("..", result ?? string.Empty);
        Assert.DoesNotContain(":", result ?? string.Empty);
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData("../..")]
    [InlineData("..")]
    [InlineData(".")]
    [InlineData("///")]
    public void SanitizeFileName_ReturnsNull_WhenNothingSafeRemains(string hostile)
    {
        Assert.Null(DocumentUploadValidator.SanitizeFileName(hostile));
    }

    [Fact]
    public void SanitizeFileName_KeepsNormalName()
    {
        Assert.Equal("invoice-2024.pdf", DocumentUploadValidator.SanitizeFileName("invoice-2024.pdf"));
    }

    [Fact]
    public void SanitizeFileName_StripsControlCharacters()
    {
        var result = DocumentUploadValidator.SanitizeFileName("invo\u0000ice.pdf");
        Assert.Equal("invoice.pdf", result);
    }

    // ---------- Executable & type rejection ----------

    [Theory]
    [InlineData("malware.exe")]
    [InlineData("payload.dll")]
    [InlineData("script.bat")]
    [InlineData("shell.cmd")]
    [InlineData("run.ps1")]
    [InlineData("page.hta")]
    [InlineData("app.jar")]
    [InlineData("exploit.msi")]
    [InlineData("macro.docm.exe")]
    public void ValidateFile_RejectsExecutablesAndScripts(string fileName)
    {
        var safe = DocumentUploadValidator.SanitizeFileName(fileName)!;
        var result = DocumentUploadValidator.ValidateFile(safe, "application/pdf", 1024);
        Assert.False(result.IsValid);
    }

    [Fact]
    public void ValidateFile_RejectsUnknownExtension()
    {
        var result = DocumentUploadValidator.ValidateFile("archive.7z", "application/x-7z-compressed", 1024);
        Assert.False(result.IsValid);
    }

    // ---------- MIME / extension agreement ----------

    [Fact]
    public void ValidateFile_RejectsMimeExtensionMismatch()
    {
        // An executable pretending to be a PDF via its claimed content type.
        var result = DocumentUploadValidator.ValidateFile("fake.pdf", "application/octet-stream", 1024);
        Assert.False(result.IsValid);
    }

    [Fact]
    public void ValidateFile_AcceptsMatchingMimeAndExtension()
    {
        var result = DocumentUploadValidator.ValidateFile("invoice.pdf", "application/pdf", 1024);
        Assert.True(result.IsValid, result.Error);
    }

    [Fact]
    public void ValidateFile_AcceptsMimeWithParameters()
    {
        var result = DocumentUploadValidator.ValidateFile("report.pdf", "application/pdf; charset=binary", 1024);
        Assert.True(result.IsValid, result.Error);
    }

    [Fact]
    public void ValidateFile_RejectsMissingContentType()
    {
        var result = DocumentUploadValidator.ValidateFile("invoice.pdf", "", 1024);
        Assert.False(result.IsValid);
    }

    // ---------- Size limits ----------

    [Fact]
    public void ValidateFile_RejectsEmptyFile()
    {
        var result = DocumentUploadValidator.ValidateFile("invoice.pdf", "application/pdf", 0);
        Assert.False(result.IsValid);
    }

    [Fact]
    public void ValidateFile_RejectsOversizedFile()
    {
        var tooBig = DocumentUploadValidator.MaxFileSizeBytes + 1;
        var result = DocumentUploadValidator.ValidateFile("invoice.pdf", "application/pdf", tooBig);
        Assert.False(result.IsValid);
    }

    [Fact]
    public void ValidateFile_AcceptsFileAtSizeLimit()
    {
        var result = DocumentUploadValidator.ValidateFile("invoice.pdf", "application/pdf", DocumentUploadValidator.MaxFileSizeBytes);
        Assert.True(result.IsValid, result.Error);
    }

    // ---------- Document types ----------

    [Theory]
    [InlineData("Invoice")]
    [InlineData("ShippingDocument")]
    [InlineData("CustomsDocument")]
    [InlineData("DeliveryConfirmation")]
    [InlineData("HealthCertificate")]
    [InlineData("VaccinationRecord")]
    [InlineData("VeterinaryDocument")]
    [InlineData("TransportDocument")]
    public void IsSupportedDocumentType_AcceptsRequiredTypes(string documentType)
    {
        Assert.True(DocumentUploadValidator.IsSupportedDocumentType(documentType));
    }

    [Theory]
    [InlineData("Executable")]
    [InlineData("Script")]
    [InlineData("Rootkit")]
    public void IsSupportedDocumentType_RejectsUnknownTypes(string documentType)
    {
        Assert.False(DocumentUploadValidator.IsSupportedDocumentType(documentType));
    }

    [Fact]
    public void SensitivePetDocumentTypes_AreProtected()
    {
        Assert.Contains("HealthCertificate", DocumentUploadValidator.SensitivePetDocumentTypes);
        Assert.Contains("VaccinationRecord", DocumentUploadValidator.SensitivePetDocumentTypes);
        Assert.Contains("VeterinaryDocument", DocumentUploadValidator.SensitivePetDocumentTypes);
    }
}
