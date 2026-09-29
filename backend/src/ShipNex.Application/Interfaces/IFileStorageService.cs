namespace ShipNex.Application.Interfaces;

/// <summary>
/// Service for file storage operations (upload, download, delete).
/// </summary>
public interface IFileStorageService
{
    Task<string> UploadAsync(Stream fileStream, string fileName, string contentType);
    Task<string> UploadAsync(byte[] fileData, string fileName, string contentType);
    Task<Stream> DownloadAsync(string fileId);
    Task<byte[]> DownloadBytesAsync(string fileId);
    Task<bool> DeleteAsync(string fileId);
    Task<bool> ExistsAsync(string fileId);
    string GetFileUrl(string fileId);
    /// <summary>
    /// Creates a short-lived access URL for a stored file. For private storage
    /// (e.g. Supabase Storage) this is a signed URL; for local storage it is the
    /// authorized API download route. URLs must expire automatically.
    /// </summary>
    Task<string> CreateTemporaryAccessUrlAsync(string fileId, int expiresInSeconds);
}

/// <summary>
/// Represents a stored file with metadata.
/// </summary>
public record StoredFile(
    string Id,
    string FileName,
    string ContentType,
    long FileSize,
    string Url,
    DateTime CreatedAt
);
