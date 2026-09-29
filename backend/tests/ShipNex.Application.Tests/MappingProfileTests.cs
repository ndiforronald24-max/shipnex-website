using ShipNex.Application.Mapping;
using ShipNex.Domain.Entities;
using ShipNex.Domain.Enums;
using ShipNex.Domain.ValueObjects;
using Xunit;

namespace ShipNex.Application.Tests;

/// <summary>
/// Verifies the manual entity-to-DTO mapping methods used by every API response.
/// </summary>
public class MappingProfileTests
{
    private static Shipment SampleShipment()
    {
        var shipment = new Shipment
        {
            TrackingNumber = "USP-2026-458921",
            ShipmentType = ShipmentType.Standard,
            ServiceType = "Express",
            SenderName = "John Doe",
            SenderAddress = "123 Main St",
            ReceiverName = "Jane Smith",
            ReceiverAddress = "456 High St",
            Origin = "New York",
            Destination = "London",
            Status = ShipmentStatus.InTransit,
            CurrentLocationName = "Atlantic Ocean",
            Weight = 12.5,
            NumberOfPieces = 2,
            ReferenceNumber = "REF-001",
            ShippingCost = new Money(199.99m),
            Tracking = new TrackingInfo(),
            EstimatedDelivery = new DateTime(2026, 9, 15, 0, 0, 0, DateTimeKind.Utc),
            CreatedAt = new DateTime(2026, 9, 8, 0, 0, 0, DateTimeKind.Utc),
        };
        shipment.TrackingEvents.Add(new ShipmentTrackingEvent
        {
            Location = "New York",
            Description = "Shipment registered and created",
            Status = ShipmentStatus.ShipmentCreated,
            Timestamp = new DateTime(2026, 9, 8, 1, 0, 0, DateTimeKind.Utc),
        });
        return shipment;
    }

    [Fact]
    public void ToResponse_Shipment_MapsCoreFields()
    {
        var s = SampleShipment();
        var dto = MappingProfile.ToResponse(s);

        Assert.Equal(s.TrackingNumber, dto.TrackingNumber);
        Assert.Equal("InTransit", dto.Status);
        Assert.Equal("New York", dto.Origin);
        Assert.Equal("London", dto.Destination);
        Assert.Equal("Atlantic Ocean", dto.CurrentLocation);
        Assert.Equal(12.5, dto.Weight);
        Assert.Equal(2, dto.NumberOfPieces);
        Assert.Equal("Express", dto.ServiceType);
        Assert.Equal("REF-001", dto.ReferenceNumber);
        Assert.Equal("John Doe", dto.SenderName);
        Assert.Equal("Jane Smith", dto.ReceiverName);
        Assert.Equal(s.Id.ToString(), dto.Id);
    }

    [Fact]
    public void ToResponse_Shipment_MapsTrackingEvents()
    {
        var dto = MappingProfile.ToResponse(SampleShipment());

        var evt = Assert.Single(dto.Events);
        Assert.Equal("New York", evt.Location);
        Assert.Equal("Shipment registered and created", evt.Description);
        Assert.Equal("ShipmentCreated", evt.Status);
        Assert.Equal(new DateTime(2026, 9, 8, 1, 0, 0, DateTimeKind.Utc), evt.Timestamp);
    }

    [Fact]
    public void ToTrackingResponse_Shipment_OmitsSenderReceiverButKeepsRoute()
    {
        var s = SampleShipment();
        var dto = MappingProfile.ToTrackingResponse(s);

        Assert.Equal("USP-2026-458921", dto.TrackingNumber);
        Assert.Equal("InTransit", dto.Status);
        Assert.Equal("New York", dto.Origin);
        Assert.Equal("London", dto.Destination);
        Assert.Equal(dto.Events.Count, s.TrackingEvents.Count);
    }

    [Fact]
    public void ToResponseList_Shipments_MapsEveryElement()
    {
        var list = new List<Shipment> { SampleShipment(), SampleShipment() };
        var dtos = MappingProfile.ToResponseList(list);
        Assert.Equal(2, dtos.Count);
        Assert.All(dtos, d => Assert.Equal("USP-2026-458921", d.TrackingNumber));
    }

    [Fact]
    public void ToResponse_Customer_MapsAllFields()
    {
        var customer = new Customer
        {
            FirstName = "Alice",
            LastName = "Johnson",
            Email = "alice@example.com",
            Phone = "+1-555-0100",
            Address = "1 Oak Ave",
        };

        var dto = MappingProfile.ToResponse(customer);

        Assert.Equal("Alice", dto.FirstName);
        Assert.Equal("Johnson", dto.LastName);
        Assert.Equal("alice@example.com", dto.Email);
        Assert.Equal("+1-555-0100", dto.Phone);
        Assert.Equal("1 Oak Ave", dto.Address);
        Assert.Equal(customer.Id.ToString(), dto.Id);
    }

    [Fact]
    public void ToResponse_Office_MapsAllFields()
    {
        var office = new Office
        {
            Name = "New York Hub",
            Code = "NYC-HUB",
            Address = "1 Harbor Rd",
            City = "New York",
            Country = "USA",
            Phone = "+1-555-0200",
            Email = "nyc@shipnex.com",
            OpeningHours = "24/7",
            Type = "Hub",
            Latitude = 40.7128,
            Longitude = -74.0060,
            IsActive = true,
        };

        var dto = MappingProfile.ToResponse(office);

        Assert.Equal("New York Hub", dto.Name);
        Assert.Equal("NYC-HUB", dto.Code);
        Assert.Equal("Hub", dto.Type);
        Assert.True(dto.IsActive);
        Assert.Equal(40.7128, dto.Latitude!.Value);
        Assert.Equal(-74.0060, dto.Longitude!.Value);
    }
}
