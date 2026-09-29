namespace ShipNex.Application.Interfaces;

/// <summary>
/// Abstraction for email delivery provider.
/// Implement this interface for SMTP, SendGrid, Mailgun, etc.
/// Never expose email API keys to the frontend.
/// </summary>
public interface IEmailService
{
    /// <summary>
    /// Sends a single email asynchronously.
    /// </summary>
    Task<EmailResult> SendAsync(string to, string subject, string htmlBody, string? textBody = null);

    /// <summary>
    /// Sends an email to multiple recipients (BCC for privacy).
    /// </summary>
    Task<EmailResult> SendBatchAsync(IEnumerable<string> recipients, string subject, string htmlBody, string? textBody = null);

    // Legacy methods for backward compatibility
    Task SendEmailAsync(string to, string subject, string body, bool isHtml = true);
    Task SendEmailAsync(string to, string subject, string body, string? attachmentPath, bool isHtml = true);
    Task SendBulkEmailAsync(IEnumerable<string> recipients, string subject, string body, bool isHtml = true);
    Task SendTemplatedEmailAsync(string to, string templateName, Dictionary<string, string> placeholders);
}

/// <summary>
/// Result of an email send operation.
/// </summary>
public record EmailResult
{
    public bool Success { get; init; }
    public string? MessageId { get; init; }
    public string? ErrorMessage { get; init; }

    public static EmailResult Ok(string? messageId = null) => new() { Success = true, MessageId = messageId };
    public static EmailResult Fail(string error) => new() { Success = false, ErrorMessage = error };
}

