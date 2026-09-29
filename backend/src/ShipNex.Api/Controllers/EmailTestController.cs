using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ShipNex.Application.Interfaces;
using ShipNex.Domain.Enums;
using ShipNex.Infrastructure.Services;

namespace ShipNex.Api.Controllers;

/// <summary>
/// Controller for testing and managing email notifications.
/// Only available in development mode.
/// </summary>
[ApiController]
[Route("api/email")]
[Authorize(Roles = "SuperAdmin,OperationsManager")]
public class EmailTestController : ControllerBase
{
    private readonly IEmailNotificationService _emailNotification;
    private readonly IEmailService _emailService;
    private readonly IConfiguration _configuration;

    public EmailTestController(
        IEmailNotificationService emailNotification,
        IEmailService emailService,
        IConfiguration configuration)
    {
        _emailNotification = emailNotification;
        _emailService = emailService;
        _configuration = configuration;
    }

    /// <summary>
    /// Tests sending a shipment notification email.
    /// </summary>
    [HttpPost("test/shipment/{shipmentId}")]
    public async Task<IActionResult> TestShipmentEmail(string shipmentId, [FromQuery] string template = "ShipmentCreated", [FromQuery] string? email = null)
    {
        var result = await _emailNotification.SendShipmentNotificationAsync(shipmentId, template, email);
        return result.Success
            ? Ok(new { success = true, messageId = result.MessageId })
            : BadRequest(new { success = false, error = result.ErrorMessage });
    }

    /// <summary>
    /// Tests sending a pet notification email.
    /// </summary>
    [HttpPost("test/pet/{petShipmentId}")]
    public async Task<IActionResult> TestPetEmail(string petShipmentId, [FromQuery] string template = "PetRegistered", [FromQuery] string? email = null)
    {
        var result = await _emailNotification.SendPetNotificationAsync(petShipmentId, template, email);
        return result.Success
            ? Ok(new { success = true, messageId = result.MessageId })
            : BadRequest(new { success = false, error = result.ErrorMessage });
    }

    /// <summary>
    /// Tests all shipment notification templates.
    /// </summary>
    [HttpPost("test/shipment-all/{shipmentId}")]
    public async Task<IActionResult> TestAllShipmentTemplates(string shipmentId, [FromQuery] string? email = null)
    {
        var templates = new[]
        {
            "ShipmentCreated", "ShipmentPickedUp", "ShipmentDeparted",
            "ShipmentInTransit", "CustomsUpdate", "ShipmentArrived",
            "OutForDelivery", "Delivered", "Delayed", "Exception"
        };

        var results = new Dictionary<string, object>();
        foreach (var template in templates)
        {
            var result = await _emailNotification.SendShipmentNotificationAsync(shipmentId, template, email);
            results[template] = new { result.Success, result.MessageId, result.ErrorMessage };
        }

        return Ok(new { tested = templates.Length, results });
    }

    /// <summary>
    /// Tests all pet notification templates.
    /// </summary>
    [HttpPost("test/pet-all/{petShipmentId}")]
    public async Task<IActionResult> TestAllPetTemplates(string petShipmentId, [FromQuery] string? email = null)
    {
        var templates = new[]
        {
            "PetRegistered", "PetJourneyStarted", "PetInTransit",
            "PetCareUpdate", "PetArrived", "PetDelivered"
        };

        var results = new Dictionary<string, object>();
        foreach (var template in templates)
        {
            var result = await _emailNotification.SendPetNotificationAsync(petShipmentId, template, email);
            results[template] = new { result.Success, result.MessageId, result.ErrorMessage };
        }

        return Ok(new { tested = templates.Length, results });
    }

    /// <summary>
    /// Triggers retry of failed notifications.
    /// </summary>
    [HttpPost("retry-failed")]
    public async Task<IActionResult> RetryFailed()
    {
        var retried = await _emailNotification.RetryFailedNotificationsAsync();
        return Ok(new { retried });
    }

    /// <summary>
    /// Gets notification logs.
    /// </summary>
    [HttpGet("logs")]
    public async Task<IActionResult> GetLogs([FromQuery] string? trackingNumber = null)
    {
        var logs = await _emailNotification.GetNotificationLogsAsync(trackingNumber);
        return Ok(logs);
    }

    /// <summary>
    /// Sends a test email to verify SMTP configuration.
    /// </summary>
    [HttpPost("test-smtp")]
    public async Task<IActionResult> TestSmtp([FromQuery] string to)
    {
        var result = await _emailService.SendAsync(to, "ShipNex SMTP Test",
            "<html><body><h1>SMTP Test Successful</h1><p>Your ShipNex email configuration is working correctly.</p></body></html>",
            "SMTP Test Successful - Your ShipNex email configuration is working correctly.");

        return result.Success
            ? Ok(new { success = true, messageId = result.MessageId })
            : BadRequest(new { success = false, error = result.ErrorMessage });
    }

    /// <summary>
    /// Gets current email configuration status.
    /// </summary>
    [HttpGet("status")]
    public IActionResult GetStatus()
    {
        var emailConfig = _configuration.GetSection("Email");
        return Ok(new
        {
            provider = emailConfig["Provider"],
            fromAddress = emailConfig["FromAddress"],
            fromName = emailConfig["FromName"],
            smtpHost = emailConfig["SmtpHost"],
            smtpPort = emailConfig["SmtpPort"],
            devMode = bool.TryParse(emailConfig["DevMode"], out var dev) && dev,
            isConfigured = !string.IsNullOrWhiteSpace(emailConfig["SmtpHost"])
        });
    }
}
