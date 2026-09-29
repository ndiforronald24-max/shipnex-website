using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ShipNex.Application.DTOs;
using ShipNex.Application.Interfaces;
using System.Security.Claims;

namespace ShipNex.Api.Controllers;

[ApiController]
[Route("api/pet-shipments")]
// NOTE: Canonical pet endpoints live in PetsController (Route "api/pets").
// This controller is kept for backward compatibility; use /api/pets for new integrations.
[Authorize(Roles = "SuperAdmin,OperationsManager,PetOperations")]
public class PetShipmentsController : ControllerBase
{
    private readonly IPetShipmentService _petService;
    private readonly IAuditService _auditService;

    public PetShipmentsController(IPetShipmentService petService, IAuditService auditService)
    {
        _petService = petService;
        _auditService = auditService;
    }

    private string GetUserId() => User?.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? string.Empty;

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var pets = await _petService.GetAllAsync();
        return Ok(pets);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(string id)
    {
        var pet = await _petService.GetByIdAsync(id);
        if (pet == null) return NotFound(new { message = "Pet shipment not found" });
        return Ok(pet);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreatePetShipmentRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var pet = await _petService.CreateAsync(request, GetUserId());
        return CreatedAtAction(nameof(GetById), new { id = pet.Id }, pet);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(string id, [FromBody] UpdatePetShipmentRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var pet = await _petService.UpdateAsync(id, request, GetUserId());
        if (pet == null) return NotFound(new { message = "Pet shipment not found" });
        return Ok(pet);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        var result = await _petService.DeleteAsync(id, GetUserId());
        if (!result) return NotFound(new { message = "Pet shipment not found" });
        return NoContent();
    }
}
