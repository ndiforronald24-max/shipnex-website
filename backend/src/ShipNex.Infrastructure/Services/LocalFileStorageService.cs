using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using ShipNex.Application.Interfaces;

namespace ShipNex.Infrastructure.Services;

/// <summary>
/// Local file system storage implementation for document upload/download.
/// </summary>
public class LocalFileStorageService : IFileStorageService
{
    private readonly string _basePath;
    private readonly ILogger<LocalFileStorageService> _logger;
    // Must stay consistent with DocumentUploadValidator.AllowedExtensions — the
    // controller layer already rejected everything outside that list, so this
    // list never accepts more than the controller does.
    private readonly string _allowedExtensions = ".pdf,.png,.jpg,.jpeg,.webp,.gif,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv";
    private readonly long _maxFileSize = 10 * 1024 * 1024; // 10 MB

    public LocalFileStorageService(IConfiguration configuration, ILogger<LocalFileStorageService> logger)
    {
        _logger = logger;
        _basePath = configuration["FileStorage:LocalPath"] ?? "uploads";

        // Ensure upload directory exists
        if (!Directory.Exists(_basePath))
        {
            Directory.CreateDirectory(_basePath);
            _logger.LogInformation("Created upload directory: {Path}", _basePath);
        }
    }

    public async Task<string> UploadAsync(Stream fileStream, string fileName, string contentType)
    {
        ValidateFile(fileName);

        if (fileStream == null || !fileStream.CanRead)
            throw new ArgumentException("File stream must be readable.", nameof(fileStream));
        // Stream overload buffers into memory like DownloadAsync does, so enforce
        // the same consistent 10 MB ceiling instead of writing unbounded files.

        var fileId = $"{DateTime.UtcNow:yyyyMMdd}_{Guid.NewGuid():N}";
        var extension = Path.GetExtension(fileName).ToLowerInvariant();
        var storedFileName = $"{fileId}{extension}";

        // Create subdirectory based on date for better organization
        var subDirectory = Path.Combine(_basePath, DateTime.UtcNow.ToString("yyyy-MM"));
        if (!Directory.Exists(subDirectory))
        {
            Directory.CreateDirectory(subDirectory);
        }

        var finalPath = Path.Combine(subDirectory, storedFileName);

        // Enforce the 10 MB ceiling while streaming (reject, don't truncate).
        await using (var fileStreamOutput = File.Create(finalPath))
        {
            var buffer = new byte[81920];
            long totalBytes = 0;
            int bytesRead;
            while ((bytesRead = await fileStream.ReadAsync(buffer)) > 0)
            {
                totalBytes += bytesRead;
                if (totalBytes > _maxFileSize)
                {
                    fileStreamOutput.Close();
                    File.Delete(finalPath);
                    throw new ArgumentException($"File exceeds the maximum allowed size of {_maxFileSize} bytes.", nameof(fileStream));
                }
                await fileStreamOutput.WriteAsync(buffer.AsMemory(0, bytesRead));
            }
        }

        var fileInfo = new FileInfo(finalPath);
        _logger.LogInformation("File uploaded: {FileId}, Size: {Size} bytes", fileId, fileInfo.Length);

        return fileId;
    }

    public async Task<string> UploadAsync(byte[] fileData, string fileName, string contentType)
    {
        ValidateFile(fileName);

        if (fileData == null || fileData.Length == 0)
            throw new ArgumentException("File data must not be empty.", nameof(fileData));
        if (fileData.Length > _maxFileSize)
            throw new ArgumentException($"File exceeds the maximum allowed size of {_maxFileSize} bytes.", nameof(fileData));

        var fileId = $"{DateTime.UtcNow:yyyyMMdd}_{Guid.NewGuid():N}";
        var extension = Path.GetExtension(fileName).ToLowerInvariant();
        var storedFileName = $"{fileId}{extension}";

        var subDirectory = Path.Combine(_basePath, DateTime.UtcNow.ToString("yyyy-MM"));
        if (!Directory.Exists(subDirectory))
        {
            Directory.CreateDirectory(subDirectory);
        }

        var finalPath = Path.Combine(subDirectory, storedFileName);
        await File.WriteAllBytesAsync(finalPath, fileData);

        _logger.LogInformation("File uploaded: {FileId}, Size: {Size} bytes", fileId, fileData.Length);

        return fileId;
    }

    public async Task<Stream> DownloadAsync(string fileId)
    {
        ValidateFileId(fileId);
        var filePath = FindFilePath(fileId);
        if (filePath == null)
        {
            throw new FileNotFoundException($"File with ID '{fileId}' not found.");
        }

        var memoryStream = new MemoryStream();
        using (var fileStream = File.OpenRead(filePath))
        {
            await fileStream.CopyToAsync(memoryStream);
        }
        memoryStream.Position = 0;
        return memoryStream;
    }

    public async Task<byte[]> DownloadBytesAsync(string fileId)
    {
        ValidateFileId(fileId);
        var filePath = FindFilePath(fileId);
        if (filePath == null)
        {
            throw new FileNotFoundException($"File with ID '{fileId}' not found.");
        }

        return await File.ReadAllBytesAsync(filePath);
    }

    public Task<bool> DeleteAsync(string fileId)
    {
        ValidateFileId(fileId);
        var filePath = FindFilePath(fileId);
        if (filePath == null)
        {
            return Task.FromResult(false);
        }

        File.Delete(filePath);
        _logger.LogInformation("File deleted: {FileId}", fileId);
        return Task.FromResult(true);
    }

    public Task<bool> ExistsAsync(string fileId)
    {
        ValidateFileId(fileId);
        var filePath = FindFilePath(fileId);
        return Task.FromResult(filePath != null);
    }

    /// <summary>
    /// Rejects file IDs that could escape the upload directory (path traversal,
    /// separators, hidden paths). Valid IDs look like "yyyyMMdd_hexguid".
    /// </summary>
    private static void ValidateFileId(string? fileId)
    {
        if (string.IsNullOrWhiteSpace(fileId))
            throw new ArgumentException("File id must not be empty.", nameof(fileId));
        if (fileId.Length > 64)
            throw new ArgumentException("File id is too long.", nameof(fileId));
        foreach (var c in fileId)
        {
            if (!char.IsAsciiLetterOrDigit(c) && c != '_')
                throw new ArgumentException("File id contains invalid characters.", nameof(fileId));
        }
    }

    public string GetFileUrl(string fileId)
    {
        return $"/api/documents/download/{fileId}";
    }

    /// <summary>
    /// Local storage is not directly reachable by clients; access always goes
    /// through the authorized API download endpoint, which enforces auth and
    /// audit logging on every request.
    /// </summary>
    public Task<string> CreateTemporaryAccessUrlAsync(string fileId, int expiresInSeconds)
    {
        ValidateFileId(fileId);
        return Task.FromResult(GetFileUrl(fileId));
    }

    private void ValidateFile(string fileName)
    {
        var extension = Path.GetExtension(fileName).ToLowerInvariant();

        if (string.IsNullOrEmpty(extension))
        {
            throw new ArgumentException("File must have an extension.");
        }

        if (!_allowedExtensions.Contains(extension))
        {
            throw new ArgumentException($"File type '{extension}' is not allowed. Allowed types: {_allowedExtensions}");
        }
    }

    private string? FindFilePath(string fileId)
    {
        // Directories are named "yyyy-MM" (see UploadAsync). Search all of them.
        foreach (var dir in Directory.GetDirectories(_basePath))
        {
            var files = Directory.GetFiles(dir, $"{fileId}.*");
            if (files.Length > 0)
            {
                return files[0];
            }
        }

        // Also check root directory
        var rootFiles = Directory.GetFiles(_basePath, $"{fileId}.*");
        return rootFiles.Length > 0 ? rootFiles[0] : null;
    }
}
