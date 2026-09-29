using System.Net;
using System.Net.Mail;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using ShipNex.Application.Interfaces;
using ShipNex.Infrastructure.Services.Templates;

namespace ShipNex.Infrastructure.Services;

public class SmtpEmailService : IEmailService
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<SmtpEmailService> _logger;
    private readonly string _fromAddress;
    private readonly string _fromName;
    private readonly string _smtpHost;
    private readonly int _smtpPort;
    private readonly string _username;
    private readonly string _password;
    private readonly bool _devMode;

    public SmtpEmailService(IConfiguration configuration, ILogger<SmtpEmailService> logger)
    {
        _configuration = configuration;
        _logger = logger;
        var emailConfig = configuration.GetSection("Email");
        _fromAddress = emailConfig["FromAddress"] ?? "no-reply@shipnex.com";
        _fromName = emailConfig["FromName"] ?? "ShipNex Logistics";
        _smtpHost = emailConfig["SmtpHost"] ?? string.Empty;
        _smtpPort = int.TryParse(emailConfig["SmtpPort"], out var port) ? port : 587;
        _username = emailConfig["Username"] ?? string.Empty;
        _password = emailConfig["Password"] ?? string.Empty;
        _devMode = bool.TryParse(emailConfig["DevMode"], out var dev) && dev;
    }

    /// <summary>
    /// Sends a single email with result tracking and dev mode support.
    /// </summary>
    public async Task<EmailResult> SendAsync(string to, string subject, string htmlBody, string? textBody = null)
    {
        if (_devMode)
        {
            _logger.LogInformation("[DEV MODE] Email to {To}: {Subject}", to, subject);
            return EmailResult.Ok($"dev-{Guid.NewGuid():N}");
        }

        if (string.IsNullOrWhiteSpace(_smtpHost))
        {
            _logger.LogWarning("SMTP not configured. Email to {To} not sent.", to);
            return EmailResult.Fail("SMTP not configured");
        }

        try
        {
            using var client = new SmtpClient(_smtpHost, _smtpPort)
            {
                EnableSsl = true,
                Credentials = new NetworkCredential(_username, _password)
            };

            using var message = new MailMessage
            {
                From = new MailAddress(_fromAddress, _fromName),
                Subject = subject,
                Body = htmlBody,
                IsBodyHtml = true
            };

            message.To.Add(to);

            if (textBody != null)
            {
                var altView = AlternateView.CreateAlternateViewFromString(textBody, null, "text/plain");
                message.AlternateViews.Add(altView);
            }

            await client.SendMailAsync(message);
            var messageId = Guid.NewGuid().ToString("N");
            _logger.LogInformation("Email sent to {To}: {Subject} [MessageId: {MessageId}]", to, subject, messageId);
            return EmailResult.Ok(messageId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send email to {To}: {Subject}", to, subject);
            return EmailResult.Fail(ex.Message);
        }
    }

    /// <summary>
    /// Sends batch email using BCC for privacy.
    /// </summary>
    public async Task<EmailResult> SendBatchAsync(IEnumerable<string> recipients, string subject, string htmlBody, string? textBody = null)
    {
        var recipientList = recipients?.Where(r => !string.IsNullOrWhiteSpace(r)).Select(r => r.Trim()).Distinct().ToList() ?? new List<string>();
        if (recipientList.Count == 0)
            return EmailResult.Fail("No recipients provided");

        // Batch honors DevMode just like SendAsync: log, never deliver.
        if (_devMode)
        {
            _logger.LogInformation("[DEV MODE] Batch email to {Count} recipients: {Subject}", recipientList.Count, subject);
            return EmailResult.Ok($"dev-batch-{Guid.NewGuid():N}");
        }

        if (string.IsNullOrWhiteSpace(_smtpHost))
        {
            _logger.LogWarning("SMTP host not configured. Batch email to {Count} recipients not sent.", recipientList.Count);
            return EmailResult.Fail("SMTP not configured");
        }

        if (string.IsNullOrWhiteSpace(_username) || string.IsNullOrWhiteSpace(_password))
        {
            _logger.LogWarning("SMTP credentials missing. Batch email to {Count} recipients not sent.", recipientList.Count);
            return EmailResult.Fail("SMTP credentials not configured");
        }

        try
        {
            using var client = new SmtpClient(_smtpHost, _smtpPort)
            {
                EnableSsl = true,
                Credentials = new NetworkCredential(_username, _password)
            };

            using var message = new MailMessage
            {
                From = new MailAddress(_fromAddress, _fromName),
                Subject = subject,
                Body = htmlBody,
                IsBodyHtml = true
            };

            // SmtpClient requires at least one To address; real recipients go to BCC only.
            message.To.Add(_fromAddress);
            foreach (var recipient in recipientList)
            {
                message.Bcc.Add(recipient);
            }

            await client.SendMailAsync(message);
            var messageId = Guid.NewGuid().ToString("N");
            _logger.LogInformation("Batch email sent to {Count} recipients: {Subject}", recipientList.Count, subject);
            return EmailResult.Ok(messageId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send batch email to {Count} recipients", recipientList.Count);
            return EmailResult.Fail(ex.Message);
        }
    }

    // Legacy methods for backward compatibility
    public async Task SendEmailAsync(string to, string subject, string body, bool isHtml = true)
    {
        await SendEmailAsync(to, subject, body, null, isHtml);
    }

    public async Task SendEmailAsync(string to, string subject, string body, string? attachmentPath, bool isHtml = true)
    {
        if (string.IsNullOrWhiteSpace(_smtpHost))
        {
            _logger.LogWarning("SMTP not configured. Email to {To} not sent.", to);
            return;
        }

        try
        {
            using var client = new SmtpClient(_smtpHost, _smtpPort)
            {
                EnableSsl = true,
                Credentials = new NetworkCredential(_username, _password)
            };

            using var message = new MailMessage
            {
                From = new MailAddress(_fromAddress, _fromName),
                Subject = subject,
                Body = body,
                IsBodyHtml = isHtml
            };

            message.To.Add(to);

            if (!string.IsNullOrEmpty(attachmentPath) && File.Exists(attachmentPath))
            {
                message.Attachments.Add(new Attachment(attachmentPath));
            }

            await client.SendMailAsync(message);
            _logger.LogInformation("Email sent to {To}: {Subject}", to, subject);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send email to {To}", to);
            throw;
        }
    }

    public async Task SendBulkEmailAsync(IEnumerable<string> recipients, string subject, string body, bool isHtml = true)
    {
        if (string.IsNullOrWhiteSpace(_smtpHost))
        {
            _logger.LogWarning("SMTP not configured. Bulk email not sent.");
            return;
        }

        using var client = new SmtpClient(_smtpHost, _smtpPort)
        {
            EnableSsl = true,
            Credentials = new NetworkCredential(_username, _password)
        };

        using var message = new MailMessage
        {
            From = new MailAddress(_fromAddress, _fromName),
            Subject = subject,
            Body = body,
            IsBodyHtml = isHtml
        };

        foreach (var recipient in recipients)
        {
            message.Bcc.Add(recipient);
        }

        await client.SendMailAsync(message);
        _logger.LogInformation("Bulk email sent to {Count} recipients", recipients.Count());
    }

    public async Task SendTemplatedEmailAsync(string to, string templateName, Dictionary<string, string> placeholders)
    {
        var template = EmailTemplateEngine.GetTemplate(templateName);
        var body = template.HtmlBody;

        foreach (var placeholder in placeholders)
        {
            body = body.Replace($"{{{{{placeholder.Key}}}}}", placeholder.Value);
        }

        var subject = template.Subject;
        foreach (var placeholder in placeholders)
        {
            subject = subject.Replace($"{{{{{placeholder.Key}}}}}", placeholder.Value);
        }

        await SendAsync(to, subject, body, template.TextBody);
    }
}
