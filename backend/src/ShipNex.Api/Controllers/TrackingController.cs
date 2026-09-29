                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ShipNex.Application.DTOs;
using ShipNex.Application.Interfaces;

namespace ShipNex.Api.Controllers;

/// <summary>
/// Public customer tracking endpoint. No account required.
/// Returns customer-safe information only — never internal notes,
/// staff details, audit logs or private customer/veterinary fields.
/// </summary>
[ApiController]
[Route("api/tracking")]
public class TrackingController : ControllerBase
{
    private readonly IShipmentService _shipmentService;
    private readonly IPetShipmentService _petService;

    public TrackingController(IShipmentService shipmentService, IPetShipmentService petService)
    {
        _shipmentService = shipmentService;
        _petService = petService;
    }

    private const string NotFoundMessage =
        "We couldn't find a shipment with that tracking number. Please check the number and try again.";

    /// <summary>Track by tracking number. Auto-detects pet tracking numbers (USP-PET-YYYY-XXXXXX).</summary>
    [HttpGet("{trackingNumber}")]
    [AllowAnonymous]
    public async Task<IActionResult> Track(string trackingNumber)
    {
        if (string.IsNullOrWhiteSpace(trackingNumber) || trackingNumber.Length > 64)
            return NotFound(new { message = NotFoundMessage });

        var normalized = trackingNumber.Trim().ToUpperInvariant();

        // Reject obviously malformed tracking numbers without revealing DB details.
        if (!normalized.StartsWith("USP-", StringComparison.OrdinalIgnoreCase))
            return NotFound(new { message = NotFoundMessage });

        if (normalized.StartsWith("USP-PET-", StringComparison.OrdinalIgnoreCase))
        {
            var pet = await _petService.GetPublicTrackingAsync(normalized);
            if (pet == null) return NotFound(new { message = NotFoundMessage });
            return Ok(new { type = "pet", result = pet });
        }

        var shipment = await _shipmentService.GetPublicTrackingAsync(normalized);
        if (shipment == null) return NotFound(new { message = NotFoundMessage });
        return Ok(new { type = "shipment", result = shipment });
    }
}