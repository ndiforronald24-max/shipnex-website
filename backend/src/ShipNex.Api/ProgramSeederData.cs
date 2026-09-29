using ShipNex.Domain.Entities;
using ShipNex.Domain.Enums;
using ShipNex.Domain.ValueObjects;
using ShipNex.Infrastructure.Data;

namespace ShipNex.Api;

public static partial class ProgramSeeder
{
    private static void SeedShipments(ShipNexDbContext context)
    {
        if (context.Shipments.Any()) return;

        var customer = context.Customers.First();
        context.Shipments.Add(new Shipment
        {
            TrackingNumber = "USP-2026-458921",
            CustomerId = customer.Id,
            ShipmentType = ShipmentType.Express,
            ServiceType = "Express",
            Origin = "New York",
            Destination = "Los Angeles",
            OriginLatitude = 40.7128,
            OriginLongitude = -74.0060,
            DestinationLatitude = 34.0522,
            DestinationLongitude = -118.2437,
            CurrentLatitude = 41.8781,
            CurrentLongitude = -87.6298,
            CurrentLocationName = "Chicago, IL",
            Status = ShipmentStatus.InTransit,
            Weight = 2.5,
            NumberOfPieces = 1,
            ReferenceNumber = "REF-2026-001",
            SenderName = "John Doe",
            SenderAddress = "123 Sender St, New York",
            ReceiverName = "Jane Smith",
            ReceiverAddress = "456 Receiver Ave, Los Angeles",
            ShippingCost = new Money(149.99m, "USD"),
            Tracking = new TrackingInfo { LastScanLocation = "Chicago, IL", LastScannedAt = DateTime.UtcNow.AddHours(-6), TotalTransitDays = 3 },
            EstimatedDelivery = DateTime.UtcNow.AddDays(1),
            TrackingEvents =
            {
                new ShipmentTrackingEvent { Location = "New York", Description = "Shipment created", Status = ShipmentStatus.ShipmentCreated, Latitude = 40.7128, Longitude = -74.0060, Timestamp = DateTime.UtcNow.AddDays(-2) },
                new ShipmentTrackingEvent { Location = "New York Hub", Description = "Departed origin facility", Status = ShipmentStatus.DepartedOrigin, Latitude = 40.7128, Longitude = -74.0060, Timestamp = DateTime.UtcNow.AddDays(-1) },
                new ShipmentTrackingEvent { Location = "Chicago, IL", Description = "Arrived at sorting facility", Status = ShipmentStatus.InTransit, Latitude = 41.8781, Longitude = -87.6298, Timestamp = DateTime.UtcNow.AddHours(-6) }
            }
        });
        context.SaveChanges();
    }

    private static void SeedPetShipments(ShipNexDbContext context)
    {
        if (context.PetShipments.Any()) return;

        var customer = context.Customers.First();
        context.PetShipments.Add(new PetShipment
        {
            TrackingNumber = "USP-PET-2026-000789",
            CustomerId = customer.Id,
            OwnerName = "Alice Johnson",
            OwnerPhone = "+1987654321",
            OwnerEmail = "alice@example.com",
            PetName = "Buddy",
            PetType = PetType.Dog,
            PetBreed = "Golden Retriever",
            PetAge = 3,
            PetGender = "Male",
            Weight = 29.5,
            Origin = "Miami",
            Destination = "Seattle",
            OriginLatitude = 25.7617,
            OriginLongitude = -80.1918,
            DestinationLatitude = 47.6062,
            DestinationLongitude = -122.3321,
            CurrentLatitude = 32.7767,
            CurrentLongitude = -96.7970,
            CurrentLocationName = "Dallas, TX",
            JourneyStatus = PetJourneyStatus.InTransit,
            VaccinationVerified = true,
            HealthCertificate = true,
            EstimatedDelivery = DateTime.UtcNow.AddDays(2),
            CarrierName = "ShipNex PetWings",
            CareEvents =
            {
                new PetCareEvent { LocationName = "Miami", Description = "Pet registered for transport", Type = PetCareEventType.ComfortCheck, CareStatus = PetCareEventStatus.Completed, EventTime = DateTime.UtcNow.AddDays(-1), CustomerVisible = true },
                new PetCareEvent { LocationName = "Miami Airport", Description = "Departed origin facility", Type = PetCareEventType.ComfortCheck, CareStatus = PetCareEventStatus.Completed, EventTime = DateTime.UtcNow.AddHours(-12), CustomerVisible = true },
                new PetCareEvent { LocationName = "Dallas, TX", Description = "Feeding and hydration check", Type = PetCareEventType.Food, CareStatus = PetCareEventStatus.Completed, EventTime = DateTime.UtcNow.AddHours(-3), CustomerVisible = true }
            }
        });
        context.SaveChanges();
    }
}