using Microsoft.EntityFrameworkCore;
using ShipNex.Domain.Entities;
using ShipNex.Domain.Enums;
using ShipNex.Infrastructure.Data;

namespace ShipNex.Api;

public static partial class ProgramSeeder
{
    public static void Seed(WebApplication app)
    {
        using var scope = app.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<ShipNexDbContext>();

        SeedUsers(context);
        SeedOffices(context);
        SeedShipments(context);
        SeedPetShipments(context);
    }

    private static void SeedUsers(ShipNexDbContext context)
    {
        if (!context.Users.Any(u => u.Role == ShipNexRoles.SuperAdmin))
        {
            context.Users.Add(new User
            {
                Email = "admin@shipnex.com",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("admin123"),
                FirstName = "Admin",
                LastName = "User",
                Phone = "+1234567890",
                Role = ShipNexRoles.SuperAdmin
            });
            context.SaveChanges();
        }

        if (!context.Customers.Any())
        {
            var adminUser = context.Users.First(u => u.Role == ShipNexRoles.SuperAdmin);
            context.Customers.Add(new Customer
            {
                FirstName = "Admin",
                LastName = "User",
                Email = "admin@shipnex.com",
                Phone = "+1234567890",
                Address = "123 Admin St, New York",
                Role = ShipNexRoles.SuperAdmin,
                UserId = adminUser.Id
            });
            context.SaveChanges();
        }
    }

    private static void SeedOffices(ShipNexDbContext context)
    {
        if (context.Offices.Any()) return;

        context.Offices.AddRange(
            new Office { Name = "New York Global Hub", Code = "NYC", Address = "123 Logistics Ave", City = "New York", Country = "USA", Phone = "+1 800 SHIP-NEX", Email = "nyc@shipnexaro.com", OpeningHours = "24/7", Type = "Hub", Latitude = 40.7128, Longitude = -74.0060 },
            new Office { Name = "Los Angeles Port Office", Code = "LAX", Address = "456 Harbor Blvd", City = "Los Angeles", Country = "USA", Phone = "+1 310 555 0100", Email = "lax@shipnexaro.com", OpeningHours = "06:00 - 22:00", Type = "Port", Latitude = 34.0522, Longitude = -118.2437 },
            new Office { Name = "London Heathrow Air Cargo", Code = "LHR", Address = "789 Cargo Way", City = "London", Country = "UK", Phone = "+44 20 7000 0000", Email = "lhr@shipnexaro.com", OpeningHours = "24/7", Type = "Airport", Latitude = 51.5074, Longitude = -0.1278 },
            new Office { Name = "Singapore Regional Hub", Code = "SIN", Address = "12 Maritime Square", City = "Singapore", Country = "Singapore", Phone = "+65 6000 0000", Email = "sin@shipnexaro.com", OpeningHours = "24/7", Type = "Hub", Latitude = 1.3521, Longitude = 103.8198 },
            new Office { Name = "Dubai Logistics City", Code = "DXB", Address = "5 Logistics City Rd", City = "Dubai", Country = "UAE", Phone = "+971 4000 0000", Email = "dxb@shipnexaro.com", OpeningHours = "24/7", Type = "Hub", Latitude = 25.2048, Longitude = 55.2708 }
        );
        context.SaveChanges();
    }
}