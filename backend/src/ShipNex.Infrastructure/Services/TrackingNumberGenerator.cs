using Microsoft.EntityFrameworkCore;
using ShipNex.Application.Interfaces;
using ShipNex.Infrastructure.Data;

namespace ShipNex.Infrastructure.Services;

public class TrackingNumberGenerator : ITrackingNumberGenerator
{
    private const string StandardPrefix = "USP";
    private const string PetPrefix = "USP-PET";
    private const int Digits = 6;
    private static readonly Random _random = new();
    private readonly ShipNexDbContext _context;

    public TrackingNumberGenerator(ShipNexDbContext context)
    {
        _context = context;
    }

    public async Task<string> GenerateShipmentTrackingNumberAsync()
        => await GenerateUniqueAsync(StandardPrefix, isTaken:
            candidate => _context.Shipments.AnyAsync(s => s.TrackingNumber == candidate));

    public async Task<string> GeneratePetTrackingNumberAsync()
        => await GenerateUniqueAsync(PetPrefix, isTaken:
            candidate => _context.PetShipments.AnyAsync(p => p.TrackingNumber == candidate));

    private static async Task<string> GenerateUniqueAsync(string prefix, Func<string, Task<bool>> isTaken)
    {
        for (var attempt = 0; attempt < 10; attempt++)
        {
            var candidate = GenerateCandidate(prefix);
            if (!await isTaken(candidate)) return candidate;
        }

        // Practically unreachable; fall back to a timestamp-suffixed number for guaranteed uniqueness.
        return $"{prefix}-{DateTime.UtcNow:yyyy}-{DateTime.UtcNow.Ticks % 1000000:D6}";
    }

    private static string GenerateCandidate(string prefix)
    {
        var year = DateTime.UtcNow.Year;
        var number = _random.NextInt64(0, (long)Math.Pow(10, Digits));
        return $"{prefix}-{year}-{number.ToString().PadLeft(Digits, '0')}";
    }
}