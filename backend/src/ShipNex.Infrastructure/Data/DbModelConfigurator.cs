using Microsoft.EntityFrameworkCore;
using ShipNex.Domain.Entities;

namespace ShipNex.Infrastructure.Data;

public static partial class DbModelConfigurator
{
    public static void Configure(ModelBuilder mb)
    {
        ConfigureUser(mb);
        ConfigureCustomer(mb);
        ConfigureShipment(mb);
        ConfigureTracking(mb);
        ConfigureDocuments(mb);
        ConfigurePets(mb);
        ConfigureFleet(mb);
        ConfigureNotifications(mb);
        ConfigureAudit(mb);
        ConfigureSoftDelete(mb);
    }

    private static void ConfigureUser(ModelBuilder mb)
    {
        mb.Entity<User>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => x.Email).IsUnique();
            e.Property(x => x.Email).HasMaxLength(256).IsRequired();
            e.Property(x => x.PasswordHash).HasMaxLength(500).IsRequired();
            e.Property(x => x.Role).HasMaxLength(50).IsRequired();
            e.HasOne(x => x.Customer).WithOne(c => c.User).HasForeignKey<Customer>(c => c.UserId);
        });
    }

    private static void ConfigureCustomer(ModelBuilder mb)
    {
        mb.Entity<Customer>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => x.Email).IsUnique();
            e.Property(x => x.Email).HasMaxLength(256).IsRequired();
            e.HasMany(x => x.Shipments).WithOne(s => s.Customer).HasForeignKey(s => s.CustomerId);
            e.HasMany(x => x.PetShipments).WithOne(p => p.Customer).HasForeignKey(p => p.CustomerId);
        });
    }

    private static void ConfigureShipment(ModelBuilder mb)
    {
        mb.Entity<Shipment>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => x.TrackingNumber).IsUnique();
            e.HasIndex(x => x.CustomerId);
            e.HasIndex(x => x.Status);
            e.HasIndex(x => x.CreatedAt);
            e.Property(x => x.TrackingNumber).HasMaxLength(30).IsRequired();
            e.Property(x => x.ReferenceNumber).HasMaxLength(100);
            e.OwnsOne(x => x.ShippingCost);
            e.OwnsOne(x => x.Tracking);
        });
    }

    private static void ConfigureTracking(ModelBuilder mb)
    {
        mb.Entity<ShipmentTrackingEvent>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => x.ShipmentId);
            e.HasIndex(x => x.Timestamp);
            e.Property(x => x.Description).HasMaxLength(500).IsRequired();
        });

        mb.Entity<ShipmentLocation>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => x.TrackingNumber);
        });
    }

    private static void ConfigureDocuments(ModelBuilder mb)
    {
        mb.Entity<ShipmentDocument>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => x.ShipmentId);
            e.HasIndex(x => x.DocumentNumber).IsUnique();
            e.Property(x => x.DocumentNumber).HasMaxLength(50).IsRequired();
            e.Property(x => x.DocumentType).HasMaxLength(50).IsRequired();
        });

        mb.Entity<Shipment>(e =>
        {
            e.HasMany(x => x.TrackingEvents).WithOne(ev => ev.Shipment).HasForeignKey(ev => ev.ShipmentId);
            e.HasMany(x => x.Documents).WithOne(d => d.Shipment).HasForeignKey(d => d.ShipmentId);
        });

        // ShipmentDocument can be owned by a Shipment or a PetShipment.
        // Only apply the Shipment soft-delete filter when ShipmentId is set;
        // pet documents are filtered through the PetShipment relationship.
        mb.Entity<ShipmentDocument>().HasQueryFilter(e =>
            e.ShipmentId == null || !e.Shipment!.IsDeleted);
    }

    private static void ConfigureSoftDelete(ModelBuilder mb)
    {
        mb.Entity<Shipment>().HasQueryFilter(e => !e.IsDeleted);
        mb.Entity<PetShipment>().HasQueryFilter(e => !e.IsDeleted);
        mb.Entity<Customer>().HasQueryFilter(e => !e.IsDeleted);

        // Matching filters on required children of filtered parents.
        mb.Entity<ShipmentTrackingEvent>().HasQueryFilter(e => !e.Shipment!.IsDeleted);
        mb.Entity<PetCareEvent>().HasQueryFilter(e => !e.PetShipment!.IsDeleted);
    }
}