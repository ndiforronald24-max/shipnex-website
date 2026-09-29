using Microsoft.EntityFrameworkCore;
using ShipNex.Application.DTOs;
using ShipNex.Application.Interfaces;
using ShipNex.Domain.Entities;
using ShipNex.Infrastructure.Data;

namespace ShipNex.Infrastructure.Services;

public class AuthService : IAuthService
{
    private readonly ShipNexDbContext _context;
    private readonly JwtService _jwtService;

    public AuthService(ShipNexDbContext context, JwtService jwtService)
    {
        _context = context;
        _jwtService = jwtService;
    }

    public async Task<AuthResponse?> LoginAsync(LoginRequest request)
    {
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Email == request.Email && u.IsActive && !u.IsDeleted);

        if (user == null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            return null;

        user.LastLoginAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        var token = _jwtService.GenerateToken(user.Id.ToString(), user.Email, user.Role, user.FirstName);
        return new AuthResponse(token, user.Id.ToString(), user.Email, user.FirstName, user.Role);
    }

    public async Task<AuthResponse?> RegisterAsync(RegisterRequest request)
    {
        if (await _context.Users.AnyAsync(u => u.Email == request.Email))
            return null;

        var user = new User
        {
            FirstName = request.FirstName,
            LastName = request.LastName,
            Email = request.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            Phone = request.Phone,
            Role = ShipNexRoles.Customer
        };

        var customer = new Customer
        {
            FirstName = request.FirstName,
            LastName = request.LastName,
            Email = request.Email,
            Phone = request.Phone,
            Address = request.Address,
            Role = ShipNexRoles.Customer,
            UserId = user.Id,
            User = user
        };

        _context.Users.Add(user);
        _context.Customers.Add(customer);
        await _context.SaveChangesAsync();

        var token = _jwtService.GenerateToken(user.Id.ToString(), user.Email, user.Role, user.FirstName);
        return new AuthResponse(token, user.Id.ToString(), user.Email, user.FirstName, user.Role);
    }
}
