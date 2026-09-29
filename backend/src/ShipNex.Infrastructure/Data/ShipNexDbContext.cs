using Microsoft.EntityFrameworkCore;
using ShipNex.Domain.Entities;

namespace ShipNex.Infrastructure.Data;

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
