using ShipNex.Application.DTOs;

namespace ShipNex.Application.Interfaces;

public interface ICustomerService
{
    Task<CustomerResponse> CreateAsync(CreateCustomerRequest request);
    Task<CustomerResponse?> GetByIdAsync(string id);
    Task<List<CustomerResponse>> GetAllAsync();
    Task<CustomerResponse?> UpdateAsync(string id, UpdateCustomerRequest request);
    Task<bool> DeleteAsync(string id);
}
