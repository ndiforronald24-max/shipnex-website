using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ShipNex.Application.DTOs;
using ShipNex.Application.Interfaces;
using System.Security.Claims;

namespace ShipNex.Api.Controllers;

[ApiController]
[Route("api/shipments")]
public class ShipmentsController : ControllerBase
{
    private readonly IShipmentService _shipmentService;

    public ShipmentsController(IShipmentService shipmentService)
    {
        _shipmentService = shipmentService;
    }

        private string GetUserId() => User?.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? string.Empty;

    [HttpGet]
    [Authorize(Roles = "SuperAdmin,OperationsManager,ShipmentStaff,CustomerSupport,ReadOnly")]
    public async Task<IActionResult> GetAll()
    {
        var shipments = await _shipmentService.GetAllAsync();
        return Ok(shipments);
    }

    [HttpGet("filtered")]
    [Authorize(Roles = "SuperAdmin,OperationsManager,ShipmentStaff,CustomerSupport,ReadOnly")]
    public async Task<IActionResult> GetFiltered(
        [FromQuery] string? trackingNumber,
        [FromQuery] string? customerId,
        [FromQuery] string? status,
        [FromQuery] string? origin,
        [FromQuery] string? destination,
        [FromQuery] DateTime? fromDate,
        [FromQuery] DateTime? toDate,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var filter = new ShipmentFilterRequest(
            TrackingNumber: trackingNumber,
            CustomerId: customerId,
            Status: status,
            Origin: origin,
            Destination: destination,
            FromDate: fromDate,
            ToDate: toDate,
            Page: page,
            PageSize: pageSize
        );

        var result = await _shipmentService.GetFilteredAsync(filter);
        return Ok(result);
    }

    [HttpGet("{id}")]
    [Authorize(Roles = "SuperAdmin,OperationsManager,ShipmentStaff,CustomerSupport,ReadOnly")]
    public async Task<IActionResult> GetById(string id)
    {
        var shipment = await _shipmentService.GetByIdAsync(id);
        if (shipment == null) return NotFound(new { message = "Shipment not found" });
        return Ok(shipment);
    }

    [HttpGet("track/{trackingNumber}")]
    [AllowAnonymous]
    [Obsolete("Use GET /api/tracking/{trackingNumber} for the public customer-safe view.")]
    public async Task<IActionResult> Track(string trackingNumber)
    {
        var result = await _shipmentService.GetPublicTrackingAsync(trackingNumber.Trim().ToUpperInvariant());
        if (result == null) return NotFound(new { message = "We couldn't find a shipment with that tracking number. Please check the number and try again." });
        return Ok(new { type = "shipment", result });
    }

    [HttpPost]
    [Authorize(Roles = "SuperAdmin,OperationsManager,ShipmentStaff")]
    public async Task<IActionResult> Create([FromBody] CreateShipmentRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var shipment = await _shipmentService.CreateAsync(request, GetUserId());
        return CreatedAtAction(nameof(GetById), new { id = shipment.Id }, shipment);
    }

    [HttpPut("{id}/status")]
    [Authorize(Roles = "SuperAdmin,OperationsManager,ShipmentStaff")]
    public async Task<IActionResult> UpdateStatus(string id, [FromBody] UpdateShipmentStatusRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var shipment = await _shipmentService.UpdateStatusAsync(id, request, GetUserId());
        if (shipment == null) return NotFound(new { message = "Shipment not found" });
        return Ok(shipment);
    }

    // POST /api/shipments/{id}/tracking-events is served by the dedicated
    // TrackingEventsController to avoid an AmbiguousMatchException.

    [HttpPut("{id}")]
    [Authorize(Roles = "SuperAdmin,OperationsManager,ShipmentStaff")]
    public async Task<IActionResult> UpdateLocation(string id, [FromBody] UpdateShipmentStatusRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var shipment = await _shipmentService.UpdateStatusAsync(id, request, GetUserId());
        if (shipment == null) return NotFound(new { message = "Shipment not found" });
        return Ok(shipment);
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "SuperAdmin,OperationsManager")]
    public async Task<IActionResult> Delete(string id)
    {
        var result = await _shipmentService.DeleteAsync(id, GetUserId());
        if (!result) return NotFound(new { message = "Shipment not found" });
        return NoContent();
    }
}
