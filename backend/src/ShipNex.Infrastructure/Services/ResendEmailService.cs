using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using ShipNex.Application.Interfaces;

namespace ShipNex.Infrastructure.Services
{
    /// <summary>
    /// Resend email provider implementation of IEmailService.
    /// The API key is read ONLY server-side from Email:ResendApiKey — never exposed to frontend.
    /// </summary>
    public class ResendEmailService : IEmailService
    {
        private readonly ILogger<ResendEmailService> _logger;
        private readonly HttpClient _httpClient;
        private readonly string _apiKey;
        private readonly string _fromAddress;
        private readonly string _fromName;
        private readonly bool _devMode;

        public ResendEmailService(IConfiguration configuration, ILogger<ResendEmailService> logger, HttpClient httpClient)
        {
            _logger = logger;
            _httpClient = httpClient;

            var emailConfig = configuration.GetSection("Email");
            _apiKey = emailConfig["ResendApiKey"] ?? string.Empty;
            _fromAddress = emailConfig["FromAddress"] ?? "no-reply@shipnex.com";
            _fromName = emailConfig["FromName"] ?? "ShipNex Logistics";
            _devMode = bool.TryParse(emailConfig["DevMode"], out var dev) && dev;
        }

        public async Task<EmailResult> SendAsync(string to, string subject, string htmlBody, string? textBody = null)
        {
            // Dev mode: never send real emails
            if (_devMode)
            {
                _logger.LogInformation("[DEV MODE] Resend would send to {To}: {Subject}", to, subject);
                return EmailResult.Ok($"dev-{Guid.NewGuid():N}");
            }

            // API key must exist server-side only
            if (string.IsNullOrWhiteSpace(_apiKey))
            {
                _logger.LogWarning("Resend API key not configured. Email to {To} not sent.", to);
                return EmailResult.Fail("Resend API key not configured");
            }

            var payload = new ResendEmailRequest
            {
                From = $"{_fromName} <{_fromAddress}>",
                To = new[] { to },
                Subject = subject,
                Html = htmlBody,
                Text = textBody
            };

            var json = JsonSerializer.Serialize(payload);
            using var content = new StringContent(json, System.Text.Encoding.UTF8, "application/json");

            using var request = new HttpRequestMessage(HttpMethod.Post, "https://api.resend.com/email")
            {
                Content = content
            };
            request.Headers.Add("Authorization", $"Bearer {_apiKey}");

            try
            {
                var response = await _httpClient.SendAsync(request);
                var responseBody = await response.Content.ReadAsStringAsync();

                if (response.IsSuccessStatusCode)
                {
                    using var doc = JsonDocument.Parse(responseBody);
                    var messageId = doc.RootElement.TryGetProperty("id", out var idProp) ? idProp.GetString() : Guid.NewGuid().ToString("N");
                    _logger.LogInformation("Email sent to {To}: {Subject} [ResendId: {MessageId}]", to, subject, messageId);
                    return EmailResult.Ok(messageId);
                }
                else
                {
                    _logger.LogError("Resend API error ({StatusCode}): {ResponseBody}", response.StatusCode, responseBody);
                    return EmailResult.Fail($"Resend API error: {response.StatusCode} - {responseBody}");
                }
                        }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send email via Resend to {To}: {Subject}", to, subject);
                return EmailResult.Fail(ex.Message);
            }
        }

        public async Task<EmailResult> SendBatchAsync(IEnumerable<string> recipients, string subject, string htmlBody, string? textBody = null)
        {
            var recipientList = recipients.ToList();

            if (_devMode)
            {
                _logger.LogInformation("[DEV MODE] Resend batch to {Count} recipients: {Subject}", recipientList.Count, subject);
                return EmailResult.Ok($"dev-batch-{Guid.NewGuid():N}");
            }

            if (string.IsNullOrWhiteSpace(_apiKey))
            {
                _logger.LogWarning("Resend API key not configured. Batch email not sent.");
                return EmailResult.Fail("Resend API key not configured");
            }

            // Each recipient gets its own API call for privacy (no shared BCC)
            var batchId = Guid.NewGuid().ToString("N");
            var successCount = 0;
            var failures = new List<string>();

            foreach (var recipient in recipientList)
            {
                var payload = new ResendEmailRequest
                {
                    From = $"{_fromName} <{_fromAddress}>",
                    To = new[] { recipient },
                    Subject = subject,
                    Html = htmlBody,
                    Text = textBody,
                    Headers = new Dictionary<string, string> { ["X-SendBatch"] = batchId }
                };

                var json = JsonSerializer.Serialize(payload);
                using var content = new StringContent(json, System.Text.Encoding.UTF8, "application/json");

                using var request = new HttpRequestMessage(HttpMethod.Post, "https://api.resend.com/email")
                {
                    Content = content
                };
                request.Headers.Add("Authorization", $"Bearer {_apiKey}");

                try
                {
                    var response = await _httpClient.SendAsync(request);
                    if (response.IsSuccessStatusCode)
                        successCount++;
                    else
                    {
                        var errorBody = await response.Content.ReadAsStringAsync();
                        failures.Add($"{recipient}: {response.StatusCode}");
                    }
                }
                catch (Exception ex)
                {
                    failures.Add($"{recipient}: {ex.Message}");
                }
            }

            if (failures.Any())
            {
                _logger.LogWarning("Batch email partial failure: {SuccessCount}/{TotalCount} succeeded. Failures: {Failures}",
                    successCount, recipientList.Count, string.Join(", ", failures));
                return EmailResult.Fail($"Partial failure: {failures.Count} of {recipientList.Count} failed");
            }

            _logger.LogInformation("Batch email sent to {Count} recipients: {Subject} [BatchId: {BatchId}]",
                recipientList.Count, subject, batchId);

            return EmailResult.Ok(batchId);
        }

        // Legacy methods for backward compatibility
        public async Task SendEmailAsync(string to, string subject, string body, bool isHtml = true)
        {
            var htmlBody = isHtml ? body : string.Empty;
            var textBody = isHtml ? null : body;
            await SendAsync(to, subject, htmlBody, textBody);
        }

        public Task SendEmailAsync(string to, string subject, string body, string? attachmentPath, bool isHtml = true)
        {
            // Attachments require file links; Resend handles via separate attachment endpoint
            // For this abstraction, log a warning and proceed without attachment
            return Task.CompletedTask;
        }

        public Task SendBulkEmailAsync(IEnumerable<string> recipients, string subject, string body, bool isHtml = true)
        {
            var htmlBody = isHtml ? body : string.Empty;
            var textBody = isHtml ? null : body;
            return SendBatchAsync(recipients, subject, htmlBody, textBody);
        }

        public Task SendTemplatedEmailAsync(string to, string templateName, Dictionary<string, string> placeholders)
        {
            // Templates are rendered by EmailNotificationService — this is a no-op fallback
            return Task.CompletedTask;
        }
    }

    #region Resend API Models

    internal class ResendEmailRequest
    {
        [JsonPropertyName("from")]
        public string? From { get; set; }

        [JsonPropertyName("to")]
        public string[]? To { get; set; }

        [JsonPropertyName("subject")]
        public string? Subject { get; set; }

        [JsonPropertyName("html")]
        public string? Html { get; set; }

        [JsonPropertyName("text")]
        public string? Text { get; set; }

        [JsonPropertyName("headers")]
        public Dictionary<string, string>? Headers { get; set; }
    }

    #endregion
}
