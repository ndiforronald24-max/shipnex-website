using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Moq;
using Xunit;
using ShipNex.Application.DTOs;
using ShipNex.Application.Interfaces;
using ShipNex.Domain.Entities;
using ShipNex.Domain.Enums;
using ShipNex.Domain.ValueObjects;
using ShipNex.Infrastructure.Data;
using ShipNex.Infrastructure.Services;

namespace ShipNex.Application.Tests;

public class ShipmentServiceTests : IDisposable
{
    private readonly ShipNexDbContext _context;
    private readonly Mock<ITrackingNumberGenerator> _trackingMock;
    private readonly Mock<IAuditService> _auditMock;
    private readonly Mock<INotificationService> _notificationMock;
    private readonly ShipmentService _service;

    public ShipmentServiceTests()
    {
        var options = new DbContextOptionsBuilder<ShipNexDbContext>()
            .UseInMemoryDatabase(databaseName: "ShipmentTests_{Guid.NewGuid()}")
            .Options;

        _context = new ShipNexDbContext(options);
        _trackingMock = new Mock<ITrackingNumberGenerator>();
        _auditMock = new Mock<IAuditService>();
        _notificationMock = new Mock<INotificationService>();

        _service = new ShipmentService(
            _context,
            _trackingMock.Object,
            _auditMock.Object,
            _notificationMock.Object);
    }

    public void Dispose()
    {
        _context.Database.EnsureDeleted();
        _context.Dispose();
    }

    #region Helper Methods

    private void SetupMocks()
    {
        _auditMock.Setup(x => x.LogAsync(
            It.IsAny<string>(), It.IsAny<string>(),
            It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(),
            It.IsAny<string>(), It.IsAny<bool>())).Returns(Task.CompletedTask);

        _notificationMock.Setup(x => x.CreateAsync(
            It.IsAny<CreateNotificationRequest>())).ReturnsAsync(new NotificationResponse(
                Guid.NewGuid().ToString(), "info", "Shipment update", "Message", false, DateTime.UtcNow));
    }

    private CreateShipmentRequest CreateValidRequest()
    {
        return new CreateShipmentRequest(
            SenderName: "John Doe",
            SenderAddress: "123 Main St",
            ReceiverName: "Jane Smith",
            ReceiverAddress: "456 Oak Ave",
            Origin: "New York",
            Destination: "London",
            Weight: 5.5,
            NumberOfPieces: 2,
            ServiceType: "Standard",
            ShipmentType: "Parcel",
            ReferenceNumber: "REF-001",
            EstimatedDelivery: null,
            Notes: null
        );
    }

    #endregion

    #region Shipment Creation Tests

    [Fact]
    public async Task CreateAsync_WithValidRequest_CreatesShipment()
    {
        var request = CreateValidRequest();
        _trackingMock.Setup(x => x.GenerateShipmentTrackingNumberAsync()).ReturnsAsync("USP-2024-000001");
        SetupMocks();

        var result = await _service.CreateAsync(request, "user-123");

        Assert.NotNull(result);
        Assert.NotEmpty(result.TrackingNumber);
        Assert.Equal("John Doe", result.SenderName);
        Assert.Equal("Jane Smith", result.ReceiverName);
        Assert.Equal("New York", result.Origin);
        Assert.Equal("London", result.Destination);
        Assert.Equal(5.5, result.Weight);
        Assert.Equal(2, result.NumberOfPieces);
        Assert.Equal("Standard", result.ServiceType);
        Assert.Equal("REF-001", result.ReferenceNumber);
        Assert.Equal(ShipmentStatus.ShipmentCreated.ToString(), result.Status);
        Assert.NotEmpty(result.Events);
    }

    [Fact]
    public async Task CreateAsync_ForPetShipment_GeneratesPetTrackingNumber()
    {
        var request = new CreateShipmentRequest(
            SenderName: "John Doe",
            SenderAddress: "123 Main St",
            ReceiverName: "Jane Smith",
            ReceiverAddress: "456 Oak Ave",
            Origin: "New York",
            Destination: "Paris",
            Weight: 10,
            NumberOfPieces: 1,
            ServiceType: "Pet Transport",
            ShipmentType: "PetTransport",
            ReferenceNumber: null,
            EstimatedDelivery: null,
            Notes: null
        );

        _trackingMock.Setup(x => x.GeneratePetTrackingNumberAsync()).ReturnsAsync("USP-PET-2024-000789");
        SetupMocks();

        var result = await _service.CreateAsync(request, "user-123");

        Assert.Equal("USP-PET-2024-000789", result.TrackingNumber);
    }

    [Fact]
    public async Task CreateAsync_CallsTrackingGenerator()
    {
        var request = CreateValidRequest();
        _trackingMock.Setup(x => x.GenerateShipmentTrackingNumberAsync()).ReturnsAsync("USP-2024-000003");
        SetupMocks();

        await _service.CreateAsync(request, "user-123");
        _trackingMock.Verify(x => x.GenerateShipmentTrackingNumberAsync(), Times.Once);
    }

    #endregion

    #region GetById Tests

    [Fact]
    public async Task GetByIdAsync_WithValidId_ReturnsShipment()
    {
        var shipment = new Shipment
        {
            Id = Guid.NewGuid(),
            TrackingNumber = "USP-2024-000009",
            SenderName = "John Doe",
            ReceiverName = "Jane Smith",
            Origin = "New York",
            Destination = "Paris",
            Status = ShipmentStatus.InTransit,
            Weight = 5,
            NumberOfPieces = 1,
            ServiceType = "Standard",
            ReferenceNumber = "REF-002",
            CreatedAt = DateTime.UtcNow,
            ShippingCost = new Money(50),
            Tracking = new TrackingInfo()
        };
        _context.Shipments.Add(shipment);
        await _context.SaveChangesAsync();

        var result = await _service.GetByIdAsync(shipment.Id.ToString());

        Assert.NotNull(result);
        Assert.Equal("USP-2024-000009", result.TrackingNumber);
        Assert.Equal("John Doe", result.SenderName);
    }

    [Fact]
    public async Task GetByIdAsync_WithInvalidId_ReturnsNull()
    {
        var result = await _service.GetByIdAsync("invalid-id");
        Assert.Null(result);
    }

    #endregion

    #region GetByTrackingNumber Tests

    [Fact]
    public async Task GetByTrackingNumberAsync_WithValidNumber_ReturnsTrackingInfo()
    {
        var shipment = new Shipment
        {
            Id = Guid.NewGuid(),
            TrackingNumber = "USP-2024-000010",
            SenderName = "John Doe",
            ReceiverName = "Jane Smith",
            Origin = "New York",
            Destination = "Paris",
            Status = ShipmentStatus.InTransit,
            Weight = 5,
            NumberOfPieces = 1,
            ServiceType = "Standard",
            ReferenceNumber = "REF-003",
            CreatedAt = DateTime.UtcNow,
            ShippingCost = new Money(50),
            Tracking = new TrackingInfo()
        };
        shipment.TrackingEvents.Add(new ShipmentTrackingEvent
        {
            Location = "New York Hub",
            Description = "Shipment created",
            Status = ShipmentStatus.ShipmentCreated,
            Timestamp = DateTime.UtcNow
        });
        _context.Shipments.Add(shipment);
        await _context.SaveChangesAsync();

        var result = await _service.GetByTrackingNumberAsync("USP-2024-000010");

        Assert.NotNull(result);
        Assert.Equal("USP-2024-000010", result.TrackingNumber);
        Assert.Equal("InTransit", result.Status);
        Assert.Equal("New York Hub", result.CurrentLocation);
        Assert.Equal("New York", result.Origin);
        Assert.Equal("Paris", result.Destination);
        Assert.NotEmpty(result.Events);
    }

    [Fact]
    public async Task GetByTrackingNumberAsync_WithInvalidNumber_ReturnsNull()
    {
        var result = await _service.GetByTrackingNumberAsync("INVALID");
        Assert.Null(result);
    }

    [Fact]
    public async Task GetFilteredAsync_WithPaging_ReturnsTotalPages()
    {
        for (int i = 1; i <= 3; i++)
        {
            var shipment = new Shipment
            {
                Id = Guid.NewGuid(),
                TrackingNumber = $"USP-2024-00002{i}",
                SenderName = "John Doe",
                ReceiverName = "Jane Smith",
                Origin = "New York",
                Destination = "Paris",
                Status = ShipmentStatus.ShipmentCreated,
                Weight = 5,
                NumberOfPieces = 1,
                ServiceType = "Standard",
                CreatedAt = DateTime.UtcNow,
                ShippingCost = new Money(50),
                Tracking = new TrackingInfo()
            };
            _context.Shipments.Add(shipment);
        }
        await _context.SaveChangesAsync();

        var result = await _service.GetFilteredAsync(new ShipmentFilterRequest(
            TrackingNumber: null, CustomerId: null, Status: null, Origin: null,
            Destination: null, FromDate: null, ToDate: null, Page: 1, PageSize: 1));

        Assert.NotNull(result);
        Assert.Equal(3, result.TotalCount);
        Assert.Equal(3, result.TotalPages);
    }

    [Fact]
    public async Task CreateAsync_CallsAuditService()
    {
        var request = CreateValidRequest();
        _trackingMock.Setup(x => x.GenerateShipmentTrackingNumberAsync()).ReturnsAsync("USP-2024-000004");
        _auditMock.Setup(x => x.LogAsync(
            It.IsAny<string>(), It.IsAny<string>(),
            It.IsAny<string>(), It.IsAny<string>(), "user-123",
            It.IsAny<string>(), It.IsAny<bool>())).Returns(Task.CompletedTask);
        _notificationMock.Setup(x => x.CreateAsync(It.IsAny<CreateNotificationRequest>())).ReturnsAsync(new NotificationResponse(
            Guid.NewGuid().ToString(), "info", "Shipment update", "Message", false, DateTime.UtcNow));

        await _service.CreateAsync(request, "user-123");

        _auditMock.Verify(x => x.LogAsync(
            It.IsAny<string>(), It.IsAny<string>(),
            It.IsAny<string>(), It.IsAny<string>(), "user-123",
            It.IsAny<string>(), It.IsAny<bool>()), Times.AtLeastOnce);
    }

    [Fact]
    public async Task CreateAsync_CreatedShipmentHasCorrectDefaultStatus()
    {
        var request = CreateValidRequest();
        _trackingMock.Setup(x => x.GenerateShipmentTrackingNumberAsync()).ReturnsAsync("USP-2024-000006");
        SetupMocks();

        var result = await _service.CreateAsync(request, "user-123");

        Assert.Equal(ShipmentStatus.ShipmentCreated.ToString(), result.Status);
        Assert.Equal("New York", result.CurrentLocation);
    }

    [Fact]
    public async Task TrackingNumberFormat_FollowsExpectedPattern()
    {
        _trackingMock.Setup(x => x.GenerateShipmentTrackingNumberAsync()).ReturnsAsync("USP-2024-123456");
        SetupMocks();

        var request = CreateValidRequest();
        var result = await _service.CreateAsync(request, "user-123");

        Assert.Matches(@"^USP-\d{4}-\d{6}$", result.TrackingNumber);
    }

    [Fact]
    public async Task GetFilteredAsync_WithTrackingNumberFilter_ReturnsMatchingShipments()
    {
        for (int i = 0; i < 10; i++)
        {
            _context.Shipments.Add(new Shipment
            {
                Id = Guid.NewGuid(),
                TrackingNumber = $"USP-2024-{i:D6}",
                SenderName = $"Sender {i}",
                ReceiverName = $"Receiver {i}",
                Origin = "New York",
                Destination = "Paris",
                Status = ShipmentStatus.ShipmentCreated,
                Weight = 5,
                NumberOfPieces = 1,
                ServiceType = "Standard",
                CreatedAt = DateTime.UtcNow.AddDays(-i),
                ShippingCost = new Money(50),
                Tracking = new TrackingInfo()
            });
        }
        await _context.SaveChangesAsync();

        var filter = new ShipmentFilterRequest(
            TrackingNumber: "USP-2024-000005", CustomerId: null, Status: null,
            Origin: null, Destination: null, FromDate: null, ToDate: null);
        var result = await _service.GetFilteredAsync(filter);

        Assert.Single(result.Items);
        Assert.Equal("USP-2024-000005", result.Items[0].TrackingNumber);
    }

    [Fact]
    public async Task GetFilteredAsync_WithStatusFilter_ReturnsMatchingShipments()
    {
        for (int i = 0; i < 10; i++)
        {
            _context.Shipments.Add(new Shipment
            {
                Id = Guid.NewGuid(),
                TrackingNumber = $"USP-2024-{i:D6}",
                SenderName = $"Sender {i}",
                ReceiverName = $"Receiver {i}",
                Origin = "New York",
                Destination = "Paris",
                Status = i % 2 == 0 ? ShipmentStatus.ShipmentCreated : ShipmentStatus.InTransit,
                Weight = 5,
                NumberOfPieces = 1,
                ServiceType = "Standard",
                CreatedAt = DateTime.UtcNow.AddDays(-i),
                ShippingCost = new Money(50),
                Tracking = new TrackingInfo()
            });
        }
        await _context.SaveChangesAsync();

        var filter = new ShipmentFilterRequest(
            TrackingNumber: null, CustomerId: null, Status: "InTransit",
            Origin: null, Destination: null, FromDate: null, ToDate: null);
        var result = await _service.GetFilteredAsync(filter);

        Assert.Equal(5, result.TotalCount);
        Assert.All(result.Items, s => Assert.Equal("InTransit", s.Status));
    }


    #endregion

    #region GetAll Tests

    [Fact]
    public async Task GetAllAsync_ReturnsAllShipments()
    {
        for (int i = 0; i < 5; i++)
        {
            _context.Shipments.Add(new Shipment
            {
                Id = Guid.NewGuid(),
                TrackingNumber = $"USP-2024-{i:D6}",
                SenderName = $"Sender {i}",
                ReceiverName = $"Receiver {i}",
                Origin = "New York",
                Destination = "Paris",
                Status = ShipmentStatus.ShipmentCreated,
                Weight = 5,
                NumberOfPieces = 1,
                ServiceType = "Standard",
                CreatedAt = DateTime.UtcNow.AddDays(-i),
                ShippingCost = new Money(50),
                Tracking = new TrackingInfo()
            });
        }
        await _context.SaveChangesAsync();

        var result = await _service.GetAllAsync();
        Assert.Equal(5, result.Count);
    }

    [Fact]
    public async Task GetAllAsync_WithNoShipments_ReturnsEmptyList()
    {
        var result = await _service.GetAllAsync();
        Assert.Empty(result);
    }

    #endregion

    #region UpdateStatus Tests

    [Fact]
    public async Task UpdateStatusAsync_WithValidRequest_UpdatesShipment()
    {
        var shipment = new Shipment
        {
            Id = Guid.NewGuid(),
            TrackingNumber = "USP-2024-000011",
            SenderName = "John Doe",
            ReceiverName = "Jane Smith",
            Origin = "New York",
            Destination = "Paris",
            Status = ShipmentStatus.ShipmentCreated,
            CurrentLocationName = "New York Hub",
            Weight = 5,
            NumberOfPieces = 1,
            ServiceType = "Standard",
            CreatedAt = DateTime.UtcNow,
            ShippingCost = new Money(50),
            Tracking = new TrackingInfo()
        };
        _context.Shipments.Add(shipment);
        await _context.SaveChangesAsync();

        var request = new UpdateShipmentStatusRequest(
            Status: "PickedUp",
            Location: "New York Sorting Facility",
            Description: "Package picked up"
        );
        SetupMocks();

        var result = await _service.UpdateStatusAsync(shipment.Id.ToString(), request, "user-123");

        Assert.NotNull(result);
        Assert.Equal(ShipmentStatus.PickedUp.ToString(), result.Status);
        Assert.Equal("New York Sorting Facility", result.CurrentLocation);
    }

    [Fact]
    public async Task UpdateStatusAsync_WithInvalidId_ReturnsNull()
    {
        var request = new UpdateShipmentStatusRequest(
            Status: "PickedUp",
            Location: "New York Sorting Facility",
            Description: null
        );
        SetupMocks();

        var result = await _service.UpdateStatusAsync("invalid-id", request, "user-123");
        Assert.Null(result);
    }

    #endregion

    #region AddTrackingEvent Tests

    [Fact]
    public async Task AddTrackingEventAsync_WithValidRequest_AddsEvent()
    {
        var shipment = new Shipment
        {
            Id = Guid.NewGuid(),
            TrackingNumber = "USP-2024-000013",
            SenderName = "John Doe",
            ReceiverName = "Jane Smith",
            Origin = "New York",
            Destination = "Paris",
            Status = ShipmentStatus.ShipmentCreated,
            CurrentLocationName = "New York Hub",
            Weight = 5,
            NumberOfPieces = 1,
            ServiceType = "Standard",
            CreatedAt = DateTime.UtcNow,
            ShippingCost = new Money(50),
            Tracking = new TrackingInfo()
        };
        // Every shipment created through the API starts with a ShipmentCreated
        // event (see ShipmentService.CreateAsync) — mirror that here so the
        // assertion below verifies initial + new event.
        shipment.TrackingEvents.Add(new ShipmentTrackingEvent
        {
            Location = "New York Hub",
            Description = "Shipment registered and created",
            Status = ShipmentStatus.ShipmentCreated,
            Timestamp = DateTime.UtcNow.AddHours(-1)
        });
        _context.Shipments.Add(shipment);
        await _context.SaveChangesAsync();

        var request = new AddTrackingEventRequest(
            Status: "InTransit",
            LocationName: "In Transit",
            Latitude: 40.7128,
            Longitude: -74.0060,
            Description: "Package is now in transit",
            EventTime: null
        );
        SetupMocks();

        var result = await _service.AddTrackingEventAsync(shipment.Id.ToString(), request, "user-123");

        Assert.NotNull(result);
        Assert.True(result.Events.Count >= 2);
        Assert.Equal("InTransit", result.Events.Last().Status);
        Assert.Equal("In Transit", result.Events.Last().Location);
    }

    [Fact]
    public async Task AddTrackingEventAsync_WithInvalidId_ReturnsNull()
    {
        var request = new AddTrackingEventRequest(
            Status: "InTransit",
            LocationName: "In Transit",
            Latitude: null,
            Longitude: null,
            Description: null,
            EventTime: null
        );
        SetupMocks();

        var result = await _service.AddTrackingEventAsync("invalid-id", request, "user-123");
        Assert.Null(result);
    }

    #endregion

    #region Delete Tests

    [Fact]
    public async Task DeleteAsync_WithValidId_ReturnsTrue()
    {
        var shipment = new Shipment
        {
            Id = Guid.NewGuid(),
            TrackingNumber = "USP-2024-000014",
            SenderName = "John Doe",
            ReceiverName = "Jane Smith",
            Origin = "New York",
            Destination = "Paris",
            Status = ShipmentStatus.ShipmentCreated,
            Weight = 5,
            NumberOfPieces = 1,
            ServiceType = "Standard",
            CreatedAt = DateTime.UtcNow,
            ShippingCost = new Money(50),
            Tracking = new TrackingInfo()
        };
        _context.Shipments.Add(shipment);
        await _context.SaveChangesAsync();
        SetupMocks();

        var result = await _service.DeleteAsync(shipment.Id.ToString(), "user-123");
        Assert.True(result);
    }

    [Fact]
    public async Task DeleteAsync_WithInvalidId_ReturnsFalse()
    {
        var result = await _service.DeleteAsync("invalid-id", "user-123");
        Assert.False(result);
    }

    #endregion
}

