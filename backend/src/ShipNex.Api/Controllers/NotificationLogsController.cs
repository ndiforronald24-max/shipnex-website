using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ShipNex.Application.DTOs;
using ShipNex.Application.Interfaces;
using ShipNex.Infrastructure.Services;
using System.Security.Claims;

namespace ShipNex.Api.Controllers;

[ApiController]
[Route("api/notification-logs")]
[Authorize(Roles = "SuperAdmin,OperationsManager,CustomerSupport,ReadOnly")]
public class NotificationLogsController : ControllerBase
{
    private readonly IEmailNotificationService _notificationService;

    public NotificationLogsController(IEmailNotificationService notificationService)
    {
        _notificationService = notificationService;
    }

    private string GetUserId() => User?.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? string.Empty;

    /// <summary>
    /// GET /api/notification-logs/stats
    /// Dashboard counters: Total, Sent, Pending, Failed, Retried
    /// </summary>
    [HttpGet("stats")]
    public async Task<IActionResult> GetStats()
        => Ok(await _notificationService.GetNotificationStatsAsync());

    /// <summary>
    /// GET /api/notification-logs?page=1&pageSize=20&statuses=Sent,Pending&search=ABC123
    /// Paged, filtered, searchable notification log listing.
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetPaged(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? statuses = null,
        [FromQuery] string? search = null)
    {
        if (pageSize > 100) pageSize = 100;
        if (pageNumber < 1) pageNumber = 1;

        var statusArray = !string.IsNullOrWhiteSpace(statuses)
            ? statuses.Split(',', StringSplitOptions.RemoveEmptyEntries)
                .Select(s => s.Trim()).ToArray()
            : (string[]?)null;

        var result = await _notificationService.GetPagedNotificationsAsync(
            statusArray, search, pageNumber, pageSize);

        return Ok(result);
    }

    /// <summary>
    /// GET /api/notification-logs/{id}
    /// Detailed view of a single notification log.
    /// </summary>
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var detail = await _notificationService.GetNotificationLogByIdAsync(id);
        if (detail == null)
            return NotFound(new { message = "Notification log not found" });
        return Ok(detail);
    }

    /// <summary>
    /// PATCH /api/notification-logs/{id}/retry
    /// Retry a single failed notification. Audit-logged. Max 3 retries.
    /// </summary>
    [HttpPatch("{id:guid}/retry")]
    [Authorize(Roles = "SuperAdmin,OperationsManager,CustomerSupport")]
    public async Task<IActionResult> Retry(Guid id)
    {
        var ip = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        var userAgent = Request.Headers["User-Agent"].FirstOrDefault() ?? "unknown";

        var success = await _notificationService.RetryNotificationAsync(id, GetUserId(), userAgent, ip);

        if (!success)
            return BadRequest(new { message = "Notification could not be retried. It may not be in a Failed state or has reached the maximum retry count." });

        return Ok(new { message = "Notification retried successfully" });
    }
}