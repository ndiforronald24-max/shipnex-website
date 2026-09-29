using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ShipNex.Application.DTOs;
using ShipNex.Application.Interfaces;
using System.Security.Claims;

namespace ShipNex.Api.Controllers;

[ApiController]
[Route("api/offices")]
public class OfficesController : ControllerBase
{
    private readonly IOfficeService _officeService;

    public OfficesController(IOfficeService officeService)
    {
        _officeService = officeService;
    }

    private string GetUserId() => User?.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? string.Empty;

    // GET: api/offices
    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetAll([FromQuery] string? region, [FromQuery] string? country, [FromQuery] string? city)
    {
        var offices = await _officeService.GetAllAsync(region, country, city);
        return Ok(offices);
    }

    // GET: api/offices/regions
    [HttpGet("regions")]
    [AllowAnonymous]
    public async Task<IActionResult> GetRegions()
    {
        var regions = await _officeService.GetRegionsAsync();
        return Ok(regions);
    }

    // GET: api/offices/countries
    [HttpGet("countries")]
    [AllowAnonymous]
    public async Task<IActionResult> GetCountries([FromQuery] string? region)
    {
        var countries = await _officeService.GetCountriesAsync(region);
        return Ok(countries);
    }

    // GET: api/offices/{id}
    [HttpGet("{id}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetById(string id)
    {
        var office = await _officeService.GetByIdAsync(id);
        if (office == null) return NotFound(new { message = "Office not found" });
        return Ok(office);
    }

    // POST: api/offices
    [HttpPost]
    [Authorize(Roles = "SuperAdmin,OperationsManager")]
    public async Task<IActionResult> Create([FromBody] CreateOfficeRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var office = await _officeService.CreateAsync(request, GetUserId());
        return CreatedAtAction(nameof(GetById), new { id = office.Id }, office);
    }

    // PUT: api/offices/{id}
    [HttpPut("{id}")]
    [Authorize(Roles = "SuperAdmin,OperationsManager")]
    public async Task<IActionResult> Update(string id, [FromBody] UpdateOfficeRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var office = await _officeService.UpdateAsync(id, request, GetUserId());
        if (office == null) return NotFound(new { message = "Office not found" });
        return Ok(office);
    }

    // DELETE: api/offices/{id}
    [HttpDelete("{id}")]
    [Authorize(Roles = "SuperAdmin")]
    public async Task<IActionResult> Delete(string id)
    {
        var result = await _officeService.DeleteAsync(id, GetUserId());
        if (!result) return NotFound(new { message = "Office not found" });
        return Ok(new { message = "Office deleted successfully" });
    }

    // POST: api/offices/{id}/deactivate
    [HttpPost("{id}/deactivate")]
    [Authorize(Roles = "SuperAdmin,OperationsManager")]
    public async Task<IActionResult> Deactivate(string id)
    {
        var result = await _officeService.DeactivateAsync(id, GetUserId());
        if (!result) return NotFound(new { message = "Office not found" });
        return Ok(new { message = "Office deactivated successfully" });
    }
}
