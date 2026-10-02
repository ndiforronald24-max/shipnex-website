using Microsoft.EntityFrameworkCore;
using ShipNex.Application.DTOs;
using ShipNex.Application.Interfaces;
using ShipNex.Domain.Entities;
using ShipNex.Infrastructure.Data;

namespace ShipNex.Infrastructure.Services;

public class OfficeService : IOfficeService
{
    private readonly ShipNexDbContext _context;
    private readonly IAuditService _auditService;

    public OfficeService(ShipNexDbContext context, IAuditService auditService)
    {
        _context = context;
        _auditService = auditService;
    }

    public async Task<List<OfficeResponse>> GetAllAsync(string? region = null, string? country = null, string? city = null)
    {
        var query = _context.Offices.Where(o => o.IsActive);

        if (!string.IsNullOrWhiteSpace(region))
            query = query.Where(o => o.Region == region);
        if (!string.IsNullOrWhiteSpace(country))
            query = query.Where(o => o.Country == country);
        if (!string.IsNullOrWhiteSpace(city))
            query = query.Where(o => o.City == city);

        var offices = await query.OrderBy(o => o.Name).ToListAsync();
        return offices.Select(MapToResponse).ToList();
    }

    public async Task<OfficeResponse?> GetByIdAsync(string id)
    {
        if (!Guid.TryParse(id, out var guid)) return null;
        var office = await _context.Offices.FindAsync(guid);
        return office == null ? null : MapToResponse(office);
    }

    public async Task<OfficeResponse> CreateAsync(CreateOfficeRequest request, string userId = "")
    {
        var office = new Office
        {
            Name = request.Name,
            Code = request.Code,
            Address = request.Address,
            City = request.City,
            State = request.State,
            Country = request.Country,
            Region = request.Region,
            PostalCode = request.PostalCode,
            Latitude = request.Latitude,
            Longitude = request.Longitude,
            Phone = request.Phone,
            Email = request.Email,
            OpeningHours = request.OpeningHours,
            ManagerName = request.ManagerName,
            ManagerPhone = request.ManagerPhone,
            Type = request.Type ?? "Hub",
            IsActive = true
        };

        _context.Offices.Add(office);
        await _context.SaveChangesAsync();

        await _auditService.LogAsync($"Created office: {office.Name}", "Create", "Office", office.Id.ToString(), userId);
        return MapToResponse(office);
    }

    public async Task<OfficeResponse?> UpdateAsync(string id, UpdateOfficeRequest request, string userId = "")
    {
        if (!Guid.TryParse(id, out var guid)) return null;
        var office = await _context.Offices.FindAsync(guid);
        if (office == null) return null;

        if (request.Name != null) office.Name = request.Name;
        if (request.Address != null) office.Address = request.Address;
        if (request.City != null) office.City = request.City;
        if (request.State != null) office.State = request.State;
        if (request.Country != null) office.Country = request.Country;
        if (request.Region != null) office.Region = request.Region;
        if (request.PostalCode != null) office.PostalCode = request.PostalCode;
        if (request.Latitude.HasValue) office.Latitude = request.Latitude;
        if (request.Longitude.HasValue) office.Longitude = request.Longitude;
        if (request.Phone != null) office.Phone = request.Phone;
        if (request.Email != null) office.Email = request.Email;
        if (request.OpeningHours != null) office.OpeningHours = request.OpeningHours;
        if (request.ManagerName != null) office.ManagerName = request.ManagerName;
        if (request.ManagerPhone != null) office.ManagerPhone = request.ManagerPhone;
        if (request.Type != null) office.Type = request.Type;
        if (request.IsActive.HasValue) office.IsActive = request.IsActive.Value;

        office.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        await _auditService.LogAsync($"Updated office: {office.Name}", "Update", "Office", office.Id.ToString(), userId);
        return MapToResponse(office);
    }
    public async Task<bool> DeleteAsync(string id, string userId = "")
    {
        if (!Guid.TryParse(id, out var guid)) return false;
        var office = await _context.Offices.FindAsync(guid);
        if (office == null) return false;

        _context.Offices.Remove(office);
        await _context.SaveChangesAsync();

        await _auditService.LogAsync($"Deleted office: {office.Name}", "Delete", "Office", office.Id.ToString(), userId);
        return true;
    }

    public async Task<bool> DeactivateAsync(string id, string userId = "")
    {
        if (!Guid.TryParse(id, out var guid)) return false;
        var office = await _context.Offices.FindAsync(guid);
        if (office == null) return false;

        office.IsActive = false;
        office.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        await _auditService.LogAsync($"Deactivated office: {office.Name}", "Deactivate", "Office", office.Id.ToString(), userId);
        return true;
    }

    public async Task<bool> SeedIfEmptyAsync()
    {
        if (await _context.Offices.AnyAsync()) return false;

        _context.Offices.AddRange(
            new Office { Name = "New York Global Hub", Code = "NYC", Address = "123 Logistics Ave", City = "New York", State = "NY", Country = "USA", Region = "North America", Phone = "+1 800 744-7639", Email = "nyc@shipnexaro.com", OpeningHours = "24/7", Type = "Hub", Latitude = 40.7128, Longitude = -74.0060, IsActive = true },
            new Office { Name = "Los Angeles Port Office", Code = "LAX", Address = "456 Harbor Blvd", City = "Los Angeles", State = "CA", Country = "USA", Region = "North America", Phone = "+1 310 555 0100", Email = "lax@shipnexaro.com", OpeningHours = "06:00 - 22:00", Type = "Port", Latitude = 34.0522, Longitude = -118.2437, IsActive = true },
            new Office { Name = "London Heathrow Air Cargo", Code = "LHR", Address = "789 Cargo Way", City = "London", Country = "UK", Region = "Europe", Phone = "+44 20 7000 0000", Email = "lhr@shipnexaro.com", OpeningHours = "24/7", Type = "Airport", Latitude = 51.5074, Longitude = -0.1278, IsActive = true },
            new Office { Name = "Frankfurt Logistics Center", Code = "FRA", Address = "45 Industriestrasse", City = "Frankfurt", Country = "Germany", Region = "Europe", Phone = "+49 69 1234 5678", Email = "fra@shipnexaro.com", OpeningHours = "06:00 - 23:00", Type = "Hub", Latitude = 50.1109, Longitude = 8.6821, IsActive = true },
            new Office { Name = "Singapore Regional Hub", Code = "SIN", Address = "12 Maritime Square", City = "Singapore", Country = "Singapore", Region = "Asia", Phone = "+65 6000 0000", Email = "sin@shipnexaro.com", OpeningHours = "24/7", Type = "Hub", Latitude = 1.3521, Longitude = 103.8198, IsActive = true },
            new Office { Name = "Tokyo Distribution Center", Code = "NRT", Address = "1-1 Cargo Bldg", City = "Tokyo", Country = "Japan", Region = "Asia", Phone = "+81 3 1234 5678", Email = "nrt@shipnexaro.com", OpeningHours = "05:00 - 23:00", Type = "Hub", Latitude = 35.6762, Longitude = 139.6503, IsActive = true },
            new Office { Name = "Dubai Logistics City", Code = "DXB", Address = "5 Logistics City Rd", City = "Dubai", Country = "UAE", Region = "Middle East", Phone = "+971 4000 0000", Email = "dxb@shipnexaro.com", OpeningHours = "24/7", Type = "Hub", Latitude = 25.2048, Longitude = 55.2708, IsActive = true },
            new Office { Name = "Sydney Oceania Hub", Code = "SYD", Address = "100 Harbour St", City = "Sydney", Country = "Australia", Region = "Oceania", Phone = "+61 2 9000 0000", Email = "syd@shipnexaro.com", OpeningHours = "06:00 - 22:00", Type = "Hub", Latitude = -33.8688, Longitude = 151.2093, IsActive = true },
            new Office { Name = "São Paulo South America Hub", Code = "GRU", Address = "200 Av. Paulista", City = "São Paulo", Country = "Brazil", Region = "South America", Phone = "+55 11 3000 0000", Email = "gru@shipnexaro.com", OpeningHours = "06:00 - 22:00", Type = "Hub", Latitude = -23.5505, Longitude = -46.6333, IsActive = true },
            new Office { Name = "Nairobi Africa Hub", Code = "NBO", Address = "50 Mombasa Rd", City = "Nairobi", Country = "Kenya", Region = "Africa", Phone = "+254 20 3000 000", Email = "nbo@shipnexaro.com", OpeningHours = "06:00 - 20:00", Type = "Hub", Latitude = -1.2921, Longitude = 36.8219, IsActive = true }
        );
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<List<string>> GetRegionsAsync()
    {
        return await _context.Offices
            .Where(o => o.IsActive && o.Region != null)
            .Select(o => o.Region!)
            .Distinct()
            .OrderBy(r => r)
            .ToListAsync();
    }

    public async Task<List<string>> GetCountriesAsync(string? region = null)
    {
        var query = _context.Offices
            .Where(o => o.IsActive && o.Country != null);

        if (!string.IsNullOrWhiteSpace(region))
            query = query.Where(o => o.Region == region);

        return await query
            .Select(o => o.Country!)
            .Distinct()
            .OrderBy(c => c)
            .ToListAsync();
    }

    private static OfficeResponse MapToResponse(Office o) => new(
        o.Id.ToString(),
        o.Name,
        o.Code,
        o.Address,
        o.City,
        o.State,
        o.Country,
        o.Region,
        o.PostalCode,
        o.Latitude,
        o.Longitude,
        o.Phone,
        o.Email,
        o.OpeningHours,
        o.ManagerName,
        o.ManagerPhone,
        o.Type,
        o.IsActive,
        o.CreatedAt,
        o.UpdatedAt
    );
}