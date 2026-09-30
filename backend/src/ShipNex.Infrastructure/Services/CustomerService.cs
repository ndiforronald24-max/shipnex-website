using Microsoft.EntityFrameworkCore;
using ShipNex.Application.DTOs;
using ShipNex.Application.Interfaces;
using ShipNex.Domain.Entities;
using ShipNex.Infrastructure.Data;

namespace ShipNex.Infrastructure.Services;

public class CustomerService : ICustomerService
{
    private readonly ShipNexDbContext _context;

    public CustomerService(ShipNexDbContext context)
    {
        _context = context;
    }

    public async Task<CustomerResponse> CreateAsync(CreateCustomerRequest request)
    {
        var customer = new Customer
        {
            FirstName = request.FirstName,
            LastName = request.LastName,
            Email = request.Email,
            Phone = request.Phone ?? string.Empty,
            Address = request.Address ?? string.Empty,
            Role = ShipNexRoles.Customer
        };

        _context.Customers.Add(customer);
        await _context.SaveChangesAsync();
        return MapToResponse(customer);
    }

    public async Task<CustomerResponse?> GetByIdAsync(string id)
    {
        if (!Guid.TryParse(id, out var guid)) return null;
        var customer = await _context.Customers.FindAsync(guid);
        return customer == null ? null : MapToResponse(customer);
    }

    public async Task<List<CustomerResponse>> GetAllAsync()
    {
        var customers = await _context.Customers
            .OrderByDescending(c => c.CreatedAt)
            .ToListAsync();
        return customers.Select(MapToResponse).ToList();
    }

    public async Task<CustomerResponse?> UpdateAsync(string id, UpdateCustomerRequest request)
    {
        if (!Guid.TryParse(id, out var guid)) return null;
        var customer = await _context.Customers.FindAsync(guid);
        if (customer == null) return null;

        customer.FirstName = request.FirstName;
        customer.LastName = request.LastName;
        customer.Phone = request.Phone ?? string.Empty;
        customer.Address = request.Address ?? string.Empty;

        await _context.SaveChangesAsync();
        return MapToResponse(customer);
    }

    public async Task<bool> DeleteAsync(string id)
    {
        if (!Guid.TryParse(id, out var guid)) return false;
        var customer = await _context.Customers.FindAsync(guid);
        if (customer == null) return false;
        _context.Customers.Remove(customer);
        await _context.SaveChangesAsync();
        return true;
    }

    private static CustomerResponse MapToResponse(Customer c) => new(
        c.Id.ToString(),
        c.FirstName,
        c.LastName,
        c.Email,
        c.Phone,
        c.Address,
        c.Role,
        c.CreatedAt
    );
}
