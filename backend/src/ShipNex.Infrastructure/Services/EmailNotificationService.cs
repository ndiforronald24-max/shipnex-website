using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using ShipNex.Application.DTOs;
using ShipNex.Application.Interfaces;
using ShipNex.Domain.Entities;
using ShipNex.Domain.Enums;
using ShipNex.Infrastructure.Data;
using ShipNex.Infrastructure.Services.Templates;

namespace ShipNex.Infrastructure.Services;

/// <summary>
/// Orchestrates transactional email notifications with retry logic and deduplication.
/// </summary>
public interface IEmailNotificationService
{
    Task<EmailResult> SendShipmentNotificationAsync(string shipmentId, string templateName, string? recipientEmail = null);
    Task<EmailResult> SendPetNotificationAsync(string petShipmentId, string templateName, string? recipientEmail = null);
    Task<int> RetryFailedNotificationsAsync(int maxRetries = 3);
    Task<List<NotificationLog>> GetNotificationLogsAsync(string? trackingNumber = null);
    Task<NotificationStatsDto> GetNotificationStatsAsync();
    Task<PagedNotificationLogResponse> GetPagedNotificationsAsync(
        string[]? statuses = null,
        string? search = null,
        int pageNumber = 1,
        int pageSize = 20);
    Task<NotificationLogDetailDto?> GetNotificationLogByIdAsync(Guid id);
    Task<bool> RetryNotificationAsync(Guid logId, string userId, string userAgent, string ipAddress);
}

public class EmailNotificationService : IEmailNotificationService
{
    private readonly ShipNexDbContext _context;
    private readonly IEmailService _emailService;
    private readonly IAuditService _auditService;
    private readonly ILogger<EmailNotificationService> _logger;
    private const int MaxRetryCount = 3;
    private readonly string _baseUrl;

    public EmailNotificationService(
        ShipNexDbContext context,
        IEmailService emailService,
        IAuditService auditService,
        ILogger<EmailNotificationService> logger,
        IConfiguration configuration)
    {
        _context = context;
        _emailService = emailService;
        _auditService = auditService;
        _logger = logger;
        _baseUrl = configuration["App:BaseUrl"] ?? "https://shipnex.com";
    }

    /// <summary>
    /// Sends a shipment notification email with deduplication.
    /// </summary>
    public async Task<EmailResult> SendShipmentNotificationAsync(string shipmentId, string templateName, string? recipientEmail = null)
    {
        var shipment = await _context.Shipments
            .Include(s => s.Customer)
            .FirstOrDefaultAsync(s => s.Id.ToString() == shipmentId);

        if (shipment == null)
            return EmailResult.Fail("Shipment not found");

        var email = recipientEmail ?? shipment.Customer?.Email ?? shipment.SenderPhone;
        if (string.IsNullOrWhiteSpace(email))
            return EmailResult.Fail("No recipient email available");

                // Deduplication: same shipment + template + recipient already SENT => skip.
        // (Matches on fields, never Guid-parses the composite notificationId.)
        if (await IsDuplicateAsync(shipmentId, null, templateName, email))
        {
            _logger.LogInformation("Duplicate notification skipped for {ShipmentId} template {TemplateName} recipient {Email}", shipmentId, templateName, email);
            return EmailResult.Ok("duplicate-skipped");
        }

        // Build tracking URL
        var trackingUrl = $"{_baseUrl}/track/{shipment.TrackingNumber}";

        // Prepare template placeholders
        var placeholders = new Dictionary<string, string>
        {
            ["CustomerName"] = shipment.Customer != null
                ? $"{shipment.Customer.FirstName} {shipment.Customer.LastName}".Trim()
                : shipment.SenderName ?? "Valued Customer",
            ["TrackingNumber"] = shipment.TrackingNumber,
            ["Status"] = shipment.Status.ToString(),
            ["Origin"] = shipment.Origin,
            ["Destination"] = shipment.Destination,
            ["EstimatedDelivery"] = shipment.EstimatedDelivery?.ToString("MMMM dd, yyyy") ?? "To be confirmed",
            ["TrackingUrl"] = trackingUrl,
            ["Year"] = DateTime.UtcNow.Year.ToString()
        };

        // Get template
        var template = EmailTemplateEngine.GetTemplate(templateName);
        var subject = template.Subject;
        var htmlBody = template.HtmlBody;
        var textBody = template.TextBody;

        // Replace placeholders
        foreach (var placeholder in placeholders)
        {
            htmlBody = htmlBody.Replace($"{{{{{placeholder.Key}}}}}", placeholder.Value);
            subject = subject.Replace($"{{{{{placeholder.Key}}}}}", placeholder.Value);
            if (textBody != null)
                textBody = textBody.Replace($"{{{{{placeholder.Key}}}}}", placeholder.Value);
        }

        // Create notification log entry
        var log = new NotificationLog
        {
            NotificationId = Guid.NewGuid(),
            ShipmentId = shipmentId,
            Recipient = email,
            Template = templateName,
            Subject = subject,
            Status = "Pending",
            Channel = NotificationChannel.Email
        };
        _context.NotificationLogs.Add(log);
        await _context.SaveChangesAsync();

        // Send email
        var result = await _emailService.SendAsync(email, subject, htmlBody, textBody);

        // Update log
        log.Status = result.Success ? "Sent" : "Failed";
        log.SentAt = result.Success ? DateTime.UtcNow : null;
        log.FailureReason = result.Success ? null : result.ErrorMessage;
        log.MessageId = result.MessageId;
        await _context.SaveChangesAsync();

        // Audit log
        await _auditService.LogAsync(
            result.Success
                ? $"Email sent: {templateName} to {email}"
                : $"Email failed: {templateName} to {email} - {result.ErrorMessage}",
            "EmailNotification",
            "Shipment",
            shipmentId,
            null
        );

        return result;
    }

    /// <summary>
    /// Sends a pet shipment notification email.
    /// </summary>
    public async Task<EmailResult> SendPetNotificationAsync(string petShipmentId, string templateName, string? recipientEmail = null)
    {
        var pet = await _context.PetShipments
            .Include(p => p.Customer)
            .FirstOrDefaultAsync(p => p.Id.ToString() == petShipmentId);

        if (pet == null)
            return EmailResult.Fail("Pet shipment not found");

        var email = recipientEmail ?? pet.Customer?.Email ?? pet.OwnerEmail;
        if (string.IsNullOrWhiteSpace(email))
            return EmailResult.Fail("No recipient email available");

        // Deduplication check
        var notificationId = $"pet-{petShipmentId}-{templateName}";
        // Match on fields, never Guid-parse the composite notificationId.
        if (await IsDuplicateAsync(null, petShipmentId, templateName, email))
        {
                        _logger.LogInformation("Duplicate pet notification skipped for {PetShipmentId} template {TemplateName} recipient {Email}", petShipmentId, templateName, email);
            return EmailResult.Ok("duplicate-skipped");
        }

        // Build tracking URL for pets
        var trackingUrl = $"{_baseUrl}/track/pet/{pet.TrackingNumber}";

        // Prepare template placeholders
        var placeholders = new Dictionary<string, string>
        {
            ["CustomerName"] = pet.Customer != null
                ? $"{pet.Customer.FirstName} {pet.Customer.LastName}".Trim()
                : pet.OwnerName ?? "Pet Owner",
            ["TrackingNumber"] = pet.TrackingNumber,
            ["PetName"] = pet.PetName,
            ["Status"] = pet.JourneyStatus.ToString(),
            ["Origin"] = pet.Origin,
            ["Destination"] = pet.Destination,
            ["EstimatedDelivery"] = pet.EstimatedDelivery?.ToString("MMMM dd, yyyy") ?? "To be confirmed",
            ["TrackingUrl"] = trackingUrl,
            ["Year"] = DateTime.UtcNow.Year.ToString()
        };

        // Get template
        var template = EmailTemplateEngine.GetTemplate(templateName);
        var subject = template.Subject;
        var htmlBody = template.HtmlBody;
        var textBody = template.TextBody;

        // Replace placeholders
        foreach (var placeholder in placeholders)
        {
            htmlBody = htmlBody.Replace($"{{{{{placeholder.Key}}}}}", placeholder.Value);
            subject = subject.Replace($"{{{{{placeholder.Key}}}}}", placeholder.Value);
            if (textBody != null)
                textBody = textBody.Replace($"{{{{{placeholder.Key}}}}}", placeholder.Value);
        }

        // Create notification log entry
        var log = new NotificationLog
        {
            NotificationId = Guid.NewGuid(),
            PetShipmentId = petShipmentId,
            Recipient = email,
            Template = templateName,
            Subject = subject,
            Status = "Pending",
            Channel = NotificationChannel.Email
        };
        _context.NotificationLogs.Add(log);
        await _context.SaveChangesAsync();

        // Send email
        var result = await _emailService.SendAsync(email, subject, htmlBody, textBody);

        // Update log
        log.Status = result.Success ? "Sent" : "Failed";
        log.SentAt = result.Success ? DateTime.UtcNow : null;
        log.FailureReason = result.Success ? null : result.ErrorMessage;
        log.MessageId = result.MessageId;
        await _context.SaveChangesAsync();

        // Audit log
        await _auditService.LogAsync(
            result.Success
                ? $"Pet email sent: {templateName} to {email}"
                : $"Pet email failed: {templateName} to {email} - {result.ErrorMessage}",
            "EmailNotification",
            "PetShipment",
            petShipmentId,
            null
        );

        return result;
    }

    /// <summary>
    /// Retries failed notifications up to the maximum retry count.
    /// </summary>
    public async Task<int> RetryFailedNotificationsAsync(int maxRetries = MaxRetryCount)
    {
        var failedLogs = await _context.NotificationLogs
            .Where(l => l.Status == "Failed" && l.RetryCount < maxRetries)
            .OrderBy(l => l.CreatedAt)
            .Take(10)
            .ToListAsync();

        var retriedCount = 0;
        foreach (var log in failedLogs)
        {
            log.RetryCount++;
            log.Status = "Pending";
            await _context.SaveChangesAsync();

                        EmailResult result;
            if (log.ShipmentId != null)
            {
                result = await _emailService.SendAsync(log.Recipient, log.Subject ?? "", log.HtmlBody ?? "", log.TextBody);
            }
            else if (log.PetShipmentId != null)
            {
                result = await _emailService.SendAsync(log.Recipient, log.Subject ?? "", log.HtmlBody ?? "", log.TextBody);
            }
            else
            {
                continue;
            }

            log.Status = result.Success ? "Sent" : "Failed";
            log.SentAt = result.Success ? DateTime.UtcNow : null;
            log.FailureReason = result.Success ? null : result.ErrorMessage;
            log.MessageId = result.MessageId;
            await _context.SaveChangesAsync();

            retriedCount++;
        }

        return retriedCount;
    }

    /// <summary>
    /// Gets notification logs for tracking and auditing.
    /// </summary>
    public async Task<List<NotificationLog>> GetNotificationLogsAsync(string? trackingNumber = null)
    {
        var query = _context.NotificationLogs.AsQueryable();

        if (!string.IsNullOrWhiteSpace(trackingNumber))
        {
            var shipmentIds = await _context.Shipments
                .Where(s => s.TrackingNumber == trackingNumber)
                .Select(s => s.Id.ToString())
                .ToListAsync();

            var petIds = await _context.PetShipments
                .Where(p => p.TrackingNumber == trackingNumber)
                .Select(p => p.Id.ToString())
                .ToListAsync();

            // ShipmentId / PetShipmentId are nullable on NotificationLog, so guard
            // before Contains - a null id can never match a real tracking id anyway.
            query = query.Where(l =>
                (l.ShipmentId != null && shipmentIds.Contains(l.ShipmentId)) ||
                (l.PetShipmentId != null && petIds.Contains(l.PetShipmentId)));
        }

                return await query.OrderByDescending(l => l.CreatedAt).Take(100).ToListAsync();
    }

    /// <summary>
    /// Gets notification log statistics for the dashboard.
    /// </summary>
    public async Task<NotificationStatsDto> GetNotificationStatsAsync()
    {
        var logs = _context.NotificationLogs.AsQueryable();
        return new NotificationStatsDto
        {
            Total = await logs.CountAsync(),
            Sent = await logs.Where(l => l.Status == "Sent").CountAsync(),
            Pending = await logs.Where(l => l.Status == "Pending").CountAsync(),
            Failed = await logs.Where(l => l.Status == "Failed").CountAsync(),
            Retried = await logs.Where(l => l.RetryCount > 0).CountAsync()
                };
    }

    /// <summary>
    /// Gets a paged, filtered list of notification logs for the admin grid.
    /// </summary>
    public async Task<PagedNotificationLogResponse> GetPagedNotificationsAsync(
        string[]? statuses = null,
        string? search = null,
        int pageNumber = 1,
        int pageSize = 20)
    {
        var query = _context.NotificationLogs.AsNoTracking().AsQueryable();

        // Filter by status
        if (statuses != null && statuses.Length > 0)
        {
            query = query.Where(l => statuses.Contains(l.Status));
        }

        // Search across tracking number, recipient email, and template
        if (!string.IsNullOrWhiteSpace(search))
        {
            var searchLower = search!.ToLowerInvariant().Trim();

            var shipmentFilter = _context.Shipments
                .Where(s => s.TrackingNumber.ToLower().Contains(searchLower))
                .Select(s => s.Id.ToString())
                .ToList();

            var petFilter = _context.PetShipments
                .Where(p => p.TrackingNumber.ToLower().Contains(searchLower))
                .Select(p => p.Id.ToString())
                .ToList();

            // Subject is nullable on NotificationLog. The previous `l.Subject!` only
            // silenced the compiler - it threw NullReferenceException at runtime for
            // any log row with a null subject, taking the admin search endpoint down.
            query = query.Where(l =>
                l.Recipient.ToLower().Contains(searchLower) ||
                l.Template.ToLower().Contains(searchLower) ||
                (l.Subject != null && l.Subject.ToLower().Contains(searchLower)) ||
                (l.ShipmentId != null && shipmentFilter.Contains(l.ShipmentId)) ||
                (l.PetShipmentId != null && petFilter.Contains(l.PetShipmentId)));
        }

        var totalCount = await query.CountAsync();

        var items = await query
            .OrderByDescending(l => l.CreatedAt)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .Select(l => new NotificationLogDto
            {
                Id = l.Id,
                NotificationId = l.NotificationId,
                Channel = l.Channel.ToString(),
                Recipient = l.Recipient,
                Status = l.Status,
                MessageId = l.MessageId,
                FailureReason = l.FailureReason,
                RetryCount = l.RetryCount,
                Template = l.Template,
                Subject = l.Subject,
                CreatedAt = l.CreatedAt,
                SentAt = l.SentAt
            })
            .ToListAsync();

        return new PagedNotificationLogResponse
        {
            Items = items,
            TotalCount = totalCount,
            PageNumber = pageNumber,
            PageSize = pageSize
                };
    }

    /// <summary>
    /// Gets detailed notification log info for the admin detail view.
    /// </summary>
    public async Task<NotificationLogDetailDto?> GetNotificationLogByIdAsync(Guid id)
    {
        var log = await _context.NotificationLogs
            .AsNoTracking()
            .FirstOrDefaultAsync(l => l.Id == id);

        if (log == null) return null;

        return new NotificationLogDetailDto
        {
            Id = log.Id,
            Template = log.Template,
            Channel = log.Channel.ToString(),
            Recipient = log.Recipient,
            Status = log.Status,
            Subject = log.Subject,
            HtmlBody = log.HtmlBody,
            TextBody = log.TextBody,
            MessageId = log.MessageId,
            FailureReason = log.FailureReason,
            RetryCount = log.RetryCount,
            ShipmentId = Guid.TryParse(log.ShipmentId, out var sid) ? sid : (Guid?)null,
            PetShipmentId = Guid.TryParse(log.PetShipmentId, out var pid) ? pid : (Guid?)null,
            CreatedAt = log.CreatedAt,
            SentAt = log.SentAt,
            DeliveredAt = log.DeliveredAt
        };
    }

    /// <summary>
    /// Retries a single failed notification. Requires the notification to be in Failed status
    /// and under the MaxRetryCount limit. Creates an audit log entry for the manual retry.
    /// </summary>
    public async Task<bool> RetryNotificationAsync(Guid logId, string userId, string userAgent, string ipAddress)
    {
        var log = await _context.NotificationLogs
            .FirstOrDefaultAsync(l => l.Id == logId);

        if (log == null)
            return false;

        if (log.Status != "Failed")
            return false;

        if (log.RetryCount >= MaxRetryCount)
            return false;

        var beforeRetryCount = log.RetryCount;
        var beforeStatus = log.Status;

        // Re-send using persisted HtmlBody/TextBody so the original content is used
        var result = await _emailService.SendAsync(
            log.Recipient,
            log.Subject ?? string.Empty,
            log.HtmlBody ?? string.Empty,
            log.TextBody);

        if (result.Success)
        {
            log.Status = "Sent";
            log.SentAt = DateTime.UtcNow;
            log.MessageId = result.MessageId;
            log.FailureReason = null;
        }
        else
        {
            log.FailureReason = result.ErrorMessage;
        }
        log.RetryCount++;

        await _context.SaveChangesAsync();

        // Audit log entry for manual retry
        await _auditService.LogAsync(
            "NotificationRetry",
            "Retry",
            "NotificationLog",
            logId.ToString(),
            userId,
            $"Before: Status={beforeStatus}, RetryCount={beforeRetryCount}; After: Status={log.Status}, RetryCount={log.RetryCount}, Success={result.Success}",
            isSuccess: result.Success
        );

        await _auditService.LogEntryAsync(new AuditLog
        {
            UserIdString = userId,
            Action = "NotificationRetry",
            ActionType = AuditActionType.Manual,
            EntityType = "NotificationLog",
            EntityIdString = logId.ToString(),
            OldValues = $"Status={beforeStatus}, RetryCount={beforeRetryCount}",
            NewValues = $"Status={log.Status}, RetryCount={log.RetryCount}",
            IpAddress = ipAddress,
            UserAgent = userAgent,
            IsSuccess = result.Success
        });

        return result.Success;
    }

    private async Task<bool> IsDuplicateAsync(string? shipmentId, string? petShipmentId, string templateName, string recipientEmail)
    {
        // NotificationIds are stamped as GUID strings: shipment-{id}-{template}
        // is never parseable as a Guid, so match on the TEMPLATE field instead
        // of parsing (Guid.Parse on it throws FormatException and kills the
        // entire notification pipeline).
        var log = await _context.NotificationLogs
            .Where(l => l.Template == templateName
                && (l.ShipmentId == shipmentId || l.PetShipmentId == petShipmentId)
                && l.Recipient == recipientEmail
                && l.Status == "Sent")
            .FirstOrDefaultAsync();

        return log != null;
    }
}
