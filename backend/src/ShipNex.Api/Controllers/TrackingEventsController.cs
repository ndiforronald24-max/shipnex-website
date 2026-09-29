using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ShipNex.Application.DTOs;
using ShipNex.Application.Interfaces;
using System.Security.Claims;

namespace ShipNex.Api.Controllers;

/// <summary>
/// Dedicated endpoint for tracking events on shipments.
/// Allows adding events (status updates, location scans, etc.) to existing shipments.
/// </summary>
[ApiController]
[Route("api/shipments/{id}/tracking-events")]
[Authorize(Roles = "SuperAdmin,OperationsManager,ShipmentStaff")]
public class TrackingEventsController : ControllerBase
{
    private readonly IShipmentService _shipmentService;

    public TrackingEventsController(IShipmentService shipmentService)
    {
        _shipmentService = shipmentService;
    }

    private string GetUserId() => User?.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? string.Empty;

    /// <summary>
    /// Add a tracking event to an existing shipment.
    /// Updates the shipment status, current location, and creates a notification.
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> AddTrackingEvent(string id, [FromBody] AddTrackingEventRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var shipment = await _shipmentService.AddTrackingEventAsync(id, request, GetUserId());
        if (shipment == null) return NotFound(new { message = "Shipment not found" });
        return Ok(shipment);
    }
}
