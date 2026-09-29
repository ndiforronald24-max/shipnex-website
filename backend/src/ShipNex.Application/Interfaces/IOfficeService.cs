using ShipNex.Application.DTOs;

namespace ShipNex.Application.Interfaces;

public interface IOfficeService
{
    Task<List<OfficeResponse>> GetAllAsync(string? region = null, string? country = null, string? city = null);
    Task<OfficeResponse?> GetByIdAsync(string id);
    Task<OfficeResponse> CreateAsync(CreateOfficeRequest request, string userId = "");
    Task<OfficeResponse?> UpdateAsync(string id, UpdateOfficeRequest request, string userId = "");
    Task<bool> DeleteAsync(string id, string userId = "");
    Task<bool> DeactivateAsync(string id, string userId = "");
    Task<bool> SeedIfEmptyAsync();
    Task<List<string>> GetRegionsAsync();
    Task<List<string>> GetCountriesAsync(string? region = null);
}
