using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using ShipNex.Domain.Entities;

namespace ShipNex.Infrastructure.Data;

/// <summary>
/// Design-time factory used ONLY by the EF Core tooling (`dotnet ef`).
///
/// Without it, `dotnet ef` has to boot the whole API host, which fails (or hangs)
/// because Program.cs demands a JWT secret, opens ports, and seeds data. This
/// factory builds the DbContext directly, so scaffolding a migration never needs
/// a running application, a real database, or any secrets.
///
/// The connection string is only used to pick the relational provider and
/// generate provider-specific SQL; nothing is connected to while scaffolding.
/// Runtime provider selection still happens in Program.cs.
/// </summary>
public class ShipNexDbContextFactory : IDesignTimeDbContextFactory<ShipNexDbContext>
{
    public ShipNexDbContext CreateDbContext(string[] args)
    {
        var connectionString =
            Environment.GetEnvironmentVariable("Database__ConnectionString")
            ?? "Host=localhost;Port=5432;Database=shipnex;Username=postgres;Password=postgres";

        var options = new DbContextOptionsBuilder<ShipNexDbContext>()
            .UseNpgsql(connectionString)
            .Options;

        return new ShipNexDbContext(options);
    }
}

public class ShipNexDbContext : DbContext
{
    public ShipNexDbContext(DbContextOptions<ShipNexDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<Customer> Customers => Set<Customer>();
    public DbSet<Shipment> Shipments => Set<Shipment>();
    public DbSet<ShipmentTrackingEvent> ShipmentTrackingEvents => Set<ShipmentTrackingEvent>();
    public DbSet<ShipmentLocation> ShipmentLocations => Set<ShipmentLocation>();
    public DbSet<ShipmentDocument> ShipmentDocuments => Set<ShipmentDocument>();
    public DbSet<PetShipment> PetShipments => Set<PetShipment>();
    public DbSet<PetCareEvent> PetCareEvents => Set<PetCareEvent>();
    public DbSet<Office> Offices => Set<Office>();
    public DbSet<Vehicle> Vehicles => Set<Vehicle>();
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<NotificationLog> NotificationLogs => Set<NotificationLog>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        DbModelConfigurator.Configure(modelBuilder);
    }
}
