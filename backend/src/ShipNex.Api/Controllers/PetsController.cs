using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ShipNex.Application.DTOs;
using ShipNex.Application.Interfaces;
using System.Security.Claims;

namespace ShipNex.Api.Controllers;

[ApiController]
[Route("api/pets")]
[Authorize]
public class PetsController : ControllerBase
{
    private readonly IPetShipmentService _petService;

    public PetsController(IPetShipmentService petService)
    {
        _petService = petService;
    }

    private string GetUserId() => User?.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? string.Empty;

    [HttpGet]
    public async Task<IActionResult> GetAll()
        => Ok(await _petService.GetAllAsync());

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(string id)
    {
        var pet = await _petService.GetByIdAsync(id);
        if (pet == null) return NotFound(new { message = "Pet shipment not found" });
        return Ok(pet);
    }

    [HttpPost]
    [Authorize(Roles = "SuperAdmin,OperationsManager,PetOperations")]
    public async Task<IActionResult> Create([FromBody] CreatePetShipmentRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var pet = await _petService.CreateAsync(request, GetUserId());
        return CreatedAtAction(nameof(GetById), new { id = pet.Id }, pet);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "SuperAdmin,OperationsManager,PetOperations")]
    public async Task<IActionResult> Update(string id, [FromBody] UpdatePetShipmentRequest request)
    {
        var pet = await _petService.UpdateAsync(id, request, GetUserId());
        if (pet == null) return NotFound(new { message = "Pet shipment not found" });
        return Ok(pet);
    }

    [HttpPut("{id}/status")]
    [Authorize(Roles = "SuperAdmin,OperationsManager,PetOperations")]
    public async Task<IActionResult> UpdateStatus(string id, [FromBody] UpdatePetStatusRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var pet = await _petService.UpdateStatusAsync(id, request, GetUserId());
        if (pet == null) return NotFound(new { message = "Pet shipment not found" });
        return Ok(pet);
    }

    [HttpPut("{id}/location")]
    [Authorize(Roles = "SuperAdmin,OperationsManager,PetOperations")]
    public async Task<IActionResult> UpdateLocation(string id, [FromBody] UpdatePetLocationRequest request)
    {
        var pet = await _petService.UpdateLocationAsync(id, request, GetUserId());
        if (pet == null) return NotFound(new { message = "Pet shipment not found" });
        return Ok(pet);
    }

    [HttpPost("{id}/care-events")]
    [Authorize(Roles = "SuperAdmin,OperationsManager,PetOperations")]
    public async Task<IActionResult> AddCareEvent(string id, [FromBody] AddPetCareEventRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var pet = await _petService.AddCareEventAsync(id, request, GetUserId());
        if (pet == null) return NotFound(new { message = "Pet shipment not found" });
        return Ok(pet);
    }

    [HttpPost("{id}/documents")]
    [Authorize(Roles = "SuperAdmin,OperationsManager,PetOperations")]
    public async Task<IActionResult> AddDocument(string id, [FromBody] CreatePetDocumentRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var pet = await _petService.AddDocumentAsync(id, request, GetUserId());
        if (pet == null) return NotFound(new { message = "Pet shipment not found" });
        return Ok(pet);
    }

    [HttpPut("{id}/documents/{documentId}/visibility")]
    [Authorize(Roles = "SuperAdmin,OperationsManager,PetOperations")]
    public async Task<IActionResult> SetDocumentVisibility(string id, string documentId, [FromBody] SetPetDocumentVisibilityRequest request)
    {
        var pet = await _petService.SetDocumentCustomerVisibleAsync(id, documentId, request.CustomerVisible, GetUserId());
        if (pet == null) return NotFound(new { message = "Pet shipment or document not found" });
        return Ok(pet);
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "SuperAdmin,OperationsManager")]
    public async Task<IActionResult> Delete(string id)
    {
        var result = await _petService.DeleteAsync(id, GetUserId());
        if (!result) return NotFound(new { message = "Pet shipment not found" });
        return NoContent();
    }

    public record SetPetDocumentVisibilityRequest(bool CustomerVisible);
}
