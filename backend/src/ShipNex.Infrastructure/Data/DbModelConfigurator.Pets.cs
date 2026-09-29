using Microsoft.EntityFrameworkCore;
using ShipNex.Domain.Entities;

namespace ShipNex.Infrastructure.Data;

public static partial class DbModelConfigurator
{
    private static void ConfigurePets(ModelBuilder mb)
    {
        mb.Entity<PetShipment>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => x.TrackingNumber).IsUnique();
            e.HasIndex(x => x.CustomerId);
            e.HasIndex(x => x.JourneyStatus);
            e.Property(x => x.TrackingNumber).HasMaxLength(35).IsRequired();
            e.Property(x => x.PetName).HasMaxLength(100);
            e.Property(x => x.Origin).HasMaxLength(200);
            e.Property(x => x.Destination).HasMaxLength(200);
            e.HasMany(x => x.CareEvents).WithOne(ev => ev.PetShipment).HasForeignKey(ev => ev.PetShipmentId);
            e.HasMany(x => x.Documents).WithOne(d => d.PetShipment).HasForeignKey(d => d.PetShipmentId);
        });

        mb.Entity<PetCareEvent>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => x.PetShipmentId);
            e.HasIndex(x => x.EventTime);
            e.HasIndex(x => x.CustomerVisible);
            e.Property(x => x.Type).IsRequired();
            e.Property(x => x.Description).HasMaxLength(500).IsRequired();
        });

        // ShipmentDocument is shared between Shipment and PetShipment.
        // Configure the pet side only here; the shipment side is in ConfigureDocuments.
        mb.Entity<ShipmentDocument>(e =>
        {
            e.HasIndex(x => x.PetShipmentId);
            e.HasIndex(x => x.CustomerVisible);
        });
    }

    private static void ConfigureFleet(ModelBuilder mb)
    {
        mb.Entity<Office>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => x.Code).IsUnique();
            e.Property(x => x.Code).HasMaxLength(10).IsRequired();
            e.HasMany(x => x.Vehicles).WithOne(v => v.Office).HasForeignKey(v => v.OfficeId);
        });

        mb.Entity<Vehicle>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => x.VIN).IsUnique();
            e.HasIndex(x => x.LicensePlate).IsUnique();
        });
    }

    private static void ConfigureNotifications(ModelBuilder mb)
    {
        mb.Entity<Notification>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => x.UserId);
            e.HasIndex(x => x.IsRead);
            e.HasMany(x => x.Logs).WithOne(l => l.Notification).HasForeignKey(l => l.NotificationId);
        });

        mb.Entity<NotificationLog>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => x.NotificationId);
        });
    }

    private static void ConfigureAudit(ModelBuilder mb)
    {
        mb.Entity<AuditLog>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => x.UserId);
            e.HasIndex(x => x.EntityType);
            e.HasIndex(x => x.CreatedAt);
            e.Property(x => x.Action).HasMaxLength(100).IsRequired();
            e.Property(x => x.EntityType).HasMaxLength(100).IsRequired();
        });
    }

}