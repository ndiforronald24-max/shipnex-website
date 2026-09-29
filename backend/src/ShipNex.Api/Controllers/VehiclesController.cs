using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ShipNex.Application.Interfaces;
using ShipNex.Domain.Entities;
using ShipNex.Domain.Enums;
using ShipNex.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.Security.Claims;

namespace ShipNex.Api.Controllers;

/// <summary>
/// Vehicle fleet management. Read access is granted to operational roles;
/// create/update requires SuperAdmin or OperationsManager; delete is SuperAdmin-only.
/// </summary>
[ApiController]
[Route("api/vehicles")]
[Authorize(Roles = "SuperAdmin,OperationsManager,ShipmentStaff,ReadOnly")]
public class VehiclesController : ControllerBase
{
    private readonly ShipNexDbContext _context;
    private readonly IAuditService _auditService;

    public VehiclesController(ShipNexDbContext context, IAuditService auditService)
    {
        _context = context;
        _auditService = auditService;
    }

    private string GetUserId() => User?.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? string.Empty;

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var vehicles = await _context.Vehicles
            .Where(v => v.IsActive)
            .OrderBy(v => v.LicensePlate)
            .ToListAsync();
        var response = vehicles.Select(v => VehicleMapper.ToResponse(v));
        return Ok(response);
    }

    [HttpPost]
    [Authorize(Roles = "SuperAdmin,OperationsManager")]
    public async Task<IActionResult> Create([FromBody] CreateVehicleRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var vehicle = new Vehicle
        {
            VIN = request.VIN ?? string.Empty,
            LicensePlate = request.LicensePlate,
            VehicleType = Enum.TryParse<VehicleType>(request.VehicleType, true, out var vt) ? vt : VehicleType.Truck,
            Make = request.Make,
            Model = request.Model,
            Year = request.Year,
            DriverName = request.DriverName,
            DriverPhone = request.DriverPhone,
            Status = string.IsNullOrWhiteSpace(request.Status) ? "Available" : request.Status,
            CapacityWeight = request.CapacityWeight,
            CurrentLocation = request.CurrentLocation,
            IsActive = true
        };
        _context.Vehicles.Add(vehicle);
        await _context.SaveChangesAsync();
        await _auditService.LogAsync($"Created vehicle {vehicle.LicensePlate}", "Create", "Vehicle",
            vehicle.Id.ToString(), GetUserId());
        return CreatedAtAction(nameof(GetAll), new { id = vehicle.Id }, VehicleMapper.ToResponse(vehicle));
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "SuperAdmin,OperationsManager")]
    public async Task<IActionResult> Update(string id, [FromBody] CreateVehicleRequest request)
    {
        if (!Guid.TryParse(id, out var guid)) return BadRequest(new { message = "Invalid vehicle id" });
        var vehicle = await _context.Vehicles.FindAsync(guid);
        if (vehicle == null || !vehicle.IsActive) return NotFound(new { message = "Vehicle not found" });

        vehicle.VIN = request.VIN ?? vehicle.VIN;
        vehicle.LicensePlate = request.LicensePlate ?? vehicle.LicensePlate;
        if (Enum.TryParse<VehicleType>(request.VehicleType, true, out var vt)) vehicle.VehicleType = vt;
        vehicle.Make = request.Make;
        vehicle.Model = request.Model;
        vehicle.Year = request.Year;
        vehicle.DriverName = request.DriverName;
        vehicle.DriverPhone = request.DriverPhone;
        if (!string.IsNullOrWhiteSpace(request.Status)) vehicle.Status = request.Status;
        vehicle.CapacityWeight = request.CapacityWeight;
        vehicle.CurrentLocation = request.CurrentLocation;
        vehicle.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        await _auditService.LogAsync($"Updated vehicle {vehicle.LicensePlate}", "Update", "Vehicle",
            vehicle.Id.ToString(), GetUserId());
        return Ok(VehicleMapper.ToResponse(vehicle));
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "SuperAdmin")]
    public async Task<IActionResult> Delete(string id)
    {
        if (!Guid.TryParse(id, out var guid)) return BadRequest(new { message = "Invalid vehicle id" });
        var vehicle = await _context.Vehicles.FindAsync(guid);
        if (vehicle == null || !vehicle.IsActive) return NotFound(new { message = "Vehicle not found" });
        vehicle.IsActive = false;
        vehicle.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        await _auditService.LogAsync($"Deleted vehicle {vehicle.LicensePlate}", "Delete", "Vehicle",
            vehicle.Id.ToString(), GetUserId());
        return NoContent();
    }
}

public static class VehicleMapper
{
    public static object ToResponse(Vehicle v) => new VehicleResponse(
        v.Id.ToString(), v.VIN, v.LicensePlate, v.VehicleType.ToString(),
        v.Make, v.Model, v.Year, v.DriverName, v.DriverPhone,
        v.Status, v.CapacityWeight, v.CurrentLocation, v.CreatedAt);
}

public record VehicleResponse(
    string Id, string VIN, string LicensePlate, string VehicleType,
    string? Make, string? Model, int? Year, string? DriverName, string? DriverPhone,
    string Status, int? CapacityWeight, string? CurrentLocation, DateTime CreatedAt);

public record CreateVehicleRequest(
    [param: Required, StringLength(50)] string LicensePlate,
    [param: StringLength(50)] string? VIN,
    [param: Required, StringLength(30)] string VehicleType,
    [param: StringLength(50)] string? Make,
    [param: StringLength(50)] string? Model,
    int? Year,
    [param: StringLength(100)] string? DriverName,
    [param: StringLength(30)] string? DriverPhone,
    [param: StringLength(20)] string? Status,
    int? CapacityWeight,
    [param: StringLength(200)] string? CurrentLocation
);
