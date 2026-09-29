using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ShipNex.Application.DTOs;
using ShipNex.Application.Interfaces;
using ShipNex.Domain.Entities;
using ShipNex.Domain.Enums;
using ShipNex.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;

namespace ShipNex.Api.Controllers;

[ApiController]
[Route("api/admin")]
[Authorize(Roles = "SuperAdmin,OperationsManager,ReadOnly")]
public class AdminController : ControllerBase
{
    private readonly ShipNexDbContext _context;
    private readonly IAuditService _auditService;

    public AdminController(ShipNexDbContext context, IAuditService auditService)
    {
        _context = context;
        _auditService = auditService;
    }

    private string GetUserId() => User?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? string.Empty;

    [HttpGet("stats")]
    public async Task<IActionResult> GetStats()
    {
        var stats = new AdminStatsResponse(
            await _context.Shipments.CountAsync(),
            await _context.Shipments.CountAsync(s => s.Status != ShipmentStatus.Delivered && s.Status != ShipmentStatus.Cancelled),
            await _context.Shipments.CountAsync(s => s.Status == ShipmentStatus.Delivered),
            await _context.PetShipments.CountAsync(),
            await _context.Customers.CountAsync(),
            await _context.Offices.CountAsync(),
            await _context.Vehicles.CountAsync(),
            await _context.Notifications.CountAsync(n => !n.IsRead)
        );
        return Ok(stats);
    }

    [HttpGet("audit-logs")]
    public async Task<IActionResult> GetAuditLogs([FromQuery] int count = 50)
        => Ok(await _auditService.GetRecentAsync(count));

    // ---------- Staff (user accounts) ----------
    // Read: SuperAdmin + OperationsManager. Modify: SuperAdmin only.

    [HttpGet("staff")]
    [Authorize(Roles = "SuperAdmin,OperationsManager")]
    public async Task<IActionResult> GetStaff()
    {
        var users = await _context.Users.OrderBy(u => u.Email).ToListAsync();
        var response = users.Select(u => new StaffResponse(
            u.Id.ToString(), u.Email, u.FirstName, u.LastName, u.Phone,
            u.Role, u.IsActive, u.LastLoginAt, u.CreatedAt));
        return Ok(response);
    }

    [HttpPut("staff/{id}")]
    [Authorize(Roles = "SuperAdmin")]
    public async Task<IActionResult> UpdateStaff(string id, [FromBody] UpdateStaffRequest request)
    {
        if (!Guid.TryParse(id, out var guid)) return BadRequest(new { message = "Invalid user id" });
        var user = await _context.Users.FindAsync(guid);
        if (user == null) return NotFound(new { message = "User not found" });

        var oldRole = user.Role;
        if (!string.IsNullOrWhiteSpace(request.Role))
        {
            if (!ShipNexRoleList.AllRoles.Contains(request.Role))
                return BadRequest(new { message = $"Unknown role '{request.Role}'" });
            user.Role = request.Role;
        }
        if (request.IsActive.HasValue) user.IsActive = request.IsActive.Value;
        user.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        await _auditService.LogAsync($"Updated staff {user.Email}: role {oldRole} -> {user.Role}, active={user.IsActive}",
            "Update", "User", user.Id.ToString(), GetUserId());

        return Ok(new StaffResponse(
            user.Id.ToString(), user.Email, user.FirstName, user.LastName, user.Phone,
            user.Role, user.IsActive, user.LastLoginAt, user.CreatedAt));
    }

    public record StaffResponse(
        string Id, string Email, string FirstName, string LastName, string? Phone,
        string Role, bool IsActive, DateTime? LastLoginAt, DateTime CreatedAt);

    public record UpdateStaffRequest(
        [param: StringLength(30)] string? Role,
        bool? IsActive
    );

    [HttpPost("audit")]
    public async Task<IActionResult> Log([FromBody] AuditEntryRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        await _auditService.LogAsync(request.Action, request.ActionType, request.EntityType,
            request.EntityId, request.UserId, request.Details);
        return Ok(new { message = "Audit entry created" });
    }

    public record AuditEntryRequest(
        [param: Required, StringLength(200)] string Action,
        [param: Required, StringLength(50)] string ActionType,
        [param: Required, StringLength(100)] string EntityType,
        [param: StringLength(50)] string? EntityId,
        [param: StringLength(50)] string? UserId,
        [param: StringLength(2000)] string? Details
    );
}