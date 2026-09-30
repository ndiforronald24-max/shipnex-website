using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;
using ShipNex.Application.DTOs;
using ShipNex.Application.Interfaces;
using ShipNex.Domain.Entities;
using ShipNex.Domain.Enums;
using ShipNex.Infrastructure.Data;
using ShipNex.Infrastructure.Services;

namespace ShipNex.Application.Tests;

/// <summary>
/// Regression tests for defects that shipped, each now pinned by a test.
///
/// PROVEN by mutation testing (reverting the fix makes them fail):
///
///   A. Optional request fields (Phone / Address / FileUrl) were assigned
///      straight into non-nullable entity properties. Registering or creating a
///      customer while omitting the optional Phone threw
///      DbUpdateException - "Required properties '{'Phone'}' are missing" - so
///      the request failed outright rather than storing a null. Phone is
///      optional on the request DTOs (string?, no [Required]) but required on
///      the entities, so the public register endpoint returned an error for
///      anyone who left it blank. Now normalised with `?? string.Empty`.
///
///   B. The pet-document mapper passed a literal null where
///      PetDocumentResponse.DocumentNumber belongs, so pet documents rendered
///      with no document number in the admin view.
///
/// NOT PROVEN - these pass with and without the fix, and are kept only to
/// document intended behaviour:
///
///   C. The notification search used `l.Subject!` on a nullable column. The
///      mutation run shows this does NOT throw under EF Core's InMemory
///      provider, which applies SQL null semantics (LOWER(NULL) -> NULL).
///      Against Npgsql the expression also translates to SQL LOWER(), which
///      likewise returns NULL rather than throwing, so the previously claimed
///      NullReferenceException in production is unproven. The explicit null
///      guards are still correct and clearer, but these tests do not
///      demonstrate a fixed crash.
/// </summary>
public class NullHandlingRegressionTests
{
    private readonly ShipNexDbContext _context;
    private readonly Mock<IEmailService> _emailMock = new();
    private readonly Mock<IAuditService> _auditMock = new();
    private readonly Mock<ILogger<EmailNotificationService>> _loggerMock = new();
    private readonly EmailNotificationService _emailNotifications;
    private readonly PetShipmentService _petShipments;
    private readonly CustomerService _customers;
    private readonly AuthService _auth;

    public NullHandlingRegressionTests()
    {
        var options = new DbContextOptionsBuilder<ShipNexDbContext>()
            .UseInMemoryDatabase(databaseName: "NullHandlingTests_" + Guid.NewGuid())
            .Options;
        _context = new ShipNexDbContext(options);

        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Jwt:SecretKey"] = "unit-test-secret-not-used-for-anything-real-0123456789",
                ["Jwt:Issuer"] = "ShipNexTests",
                ["Jwt:Audience"] = "ShipNexTests",
                ["App:BaseUrl"] = "https://shipnex.test"
            })
            .Build();

        _emailNotifications = new EmailNotificationService(
            _context, _emailMock.Object, _auditMock.Object, _loggerMock.Object, config);

        _petShipments = new PetShipmentService(
            _context, Mock.Of<ITrackingNumberGenerator>(),
            _auditMock.Object, Mock.Of<INotificationService>());

        _customers = new CustomerService(_context);
        _auth = new AuthService(_context, new JwtService(config));
    }

    #region C. Notification search over nullable columns (behaviour documented, NOT mutation-proven)

    [Fact]
    public async Task GetPagedNotificationsAsync_SearchWithNullSubject_ReturnsRows()
    {
        // NOTE: this passes with or without the null guards - see the class
        // comment. It documents the intended filtering behaviour, not a
        // reproduced crash.
        _context.NotificationLogs.AddRange(
            new NotificationLog
            {
                NotificationId = Guid.NewGuid(),
                Recipient = "customer@example.com",
                Status = "Sent",
                Template = "ShipmentCreated",
                Subject = null,                       // <-- the regression
                ShipmentId = null,
                PetShipmentId = null,
                CreatedAt = DateTime.UtcNow.AddMinutes(-5)
            },
            new NotificationLog
            {
                NotificationId = Guid.NewGuid(),
                Recipient = "other@example.com",
                Status = "Failed",
                Template = "PetBooked",
                Subject = "Your pet is booked",
                ShipmentId = null,
                PetShipmentId = null,
                CreatedAt = DateTime.UtcNow.AddMinutes(-1)
            });
        await _context.SaveChangesAsync();

        var result = await _emailNotifications.GetPagedNotificationsAsync(
            statuses: null, search: "e", pageNumber: 1, pageSize: 20);

        Assert.NotNull(result);
        Assert.Equal(2, result.TotalCount);
        Assert.Contains(result.Items, i => i.Subject == null);
        Assert.Contains(result.Items, i => i.Subject == "Your pet is booked");
    }

    [Fact]
    public async Task GetPagedNotificationsAsync_NullSubjectNotMatchingSearch_IsExcluded()
    {
        // A null subject must not match a search term, and must not throw.
        _context.NotificationLogs.Add(new NotificationLog
        {
            NotificationId = Guid.NewGuid(),
            Recipient = "nobody@example.com",
            Status = "Sent",
            Template = "ShipmentCreated",
            Subject = null,
            CreatedAt = DateTime.UtcNow
        });
        await _context.SaveChangesAsync();

        var result = await _emailNotifications.GetPagedNotificationsAsync(
            statuses: null, search: "zzzznotpresent", pageNumber: 1, pageSize: 20);

        Assert.Equal(0, result.TotalCount);
    }

    [Fact]
    public async Task GetPagedNotificationsAsync_FilterByTrackingNumber_MatchesOnlyLinkedRow()
    {
        // The tracking-number filter calls List<string>.Contains(l.ShipmentId)
        // where ShipmentId is string?. Rows with no shipment link are normal for
        // pet and system notifications.
        var shipmentId = Guid.NewGuid();
        _context.Shipments.Add(new Shipment
        {
            Id = shipmentId,
            TrackingNumber = "USP-2026-000042",
            SenderName = "John Doe",
            ReceiverName = "Jane Smith",
            Origin = "New York",
            Destination = "London",
            Status = ShipmentStatus.ShipmentCreated,
            ShipmentType = ShipmentType.Standard,
            ServiceType = "Standard",
            Weight = 1,
            NumberOfPieces = 1,
            CreatedAt = DateTime.UtcNow
        });
        _context.NotificationLogs.AddRange(
            new NotificationLog
            {
                NotificationId = Guid.NewGuid(),
                Recipient = "linked@example.com",
                Status = "Sent",
                Template = "ShipmentCreated",
                Subject = "Shipment booked",
                ShipmentId = shipmentId.ToString(),
                PetShipmentId = null,
                CreatedAt = DateTime.UtcNow
            },
            new NotificationLog
            {
                NotificationId = Guid.NewGuid(),
                Recipient = "unlinked@example.com",
                Status = "Sent",
                Template = "PetBooked",
                Subject = null,
                ShipmentId = null,
                PetShipmentId = null,                 // <-- null on both filters
                CreatedAt = DateTime.UtcNow
            });
        await _context.SaveChangesAsync();

        var result = await _emailNotifications.GetPagedNotificationsAsync(
            statuses: null, search: "USP-2026-000042", pageNumber: 1, pageSize: 20);

        Assert.Equal(1, result.TotalCount);
        Assert.Equal("linked@example.com", result.Items[0].Recipient);
    }

    #endregion

    #region B. Pet document number is mapped

    [Fact]
    public async Task GetByIdAsync_PetDocument_MapsDocumentNumber()
    {
        var pet = new PetShipment
        {
            TrackingNumber = "PET-2026-000007",
            OwnerName = "Alex Kim",
            OwnerPhone = "+1 555 0100",
            OwnerEmail = "alex@example.com",
            PetName = "Rex",
            PetType = PetType.Dog,
            PetBreed = "Border Collie",
            Origin = "Berlin",
            Destination = "New York",
            ServiceType = "Standard",
            ShipmentType = "PetTransport",
            CreatedAt = DateTime.UtcNow
        };
        pet.Documents.Add(new ShipmentDocument
        {
            PetShipmentId = pet.Id,
            DocumentNumber = "VET-99182",             // <-- must reach the response
            DocumentType = "HealthCertificate",
            FileName = "rex-health.pdf",
            FileUrl = "https://files.example/rex-health.pdf",
            ContentType = "application/pdf",
            FileSize = 2048
        });
        _context.PetShipments.Add(pet);
        await _context.SaveChangesAsync();

        var result = await _petShipments.GetByIdAsync(pet.Id.ToString());

        Assert.NotNull(result);
        Assert.NotNull(result!.Documents);
        var doc = Assert.Single(result.Documents);
        // Previously mapped as a bare `null`, so the admin view showed no
        // document number at all.
        Assert.Equal("VET-99182", doc.DocumentNumber);
        Assert.Equal("HealthCertificate", doc.DocumentType);
    }

    [Fact]
    public async Task AddDocumentAsync_WithNullFileUrl_StoresEmptyStringNotNull()
    {
        var pet = new PetShipment
        {
            TrackingNumber = "PET-2026-000008",
            OwnerName = "Alex Kim",
            OwnerPhone = "+1 555 0100",
            OwnerEmail = "alex@example.com",
            PetName = "Rex",
            PetType = PetType.Dog,
            PetBreed = "Border Collie",
            Origin = "Berlin",
            Destination = "New York",
            CreatedAt = DateTime.UtcNow
        };
        _context.PetShipments.Add(pet);
        await _context.SaveChangesAsync();

        var request = new CreatePetDocumentRequest(
            DocumentType: "Invoice",
            FileName: "invoice.pdf",
            FileUrl: null,                            // <-- optional field omitted
            ContentType: "application/pdf",
            FileSize: 100,
            Description: null,
            IssuedAt: null,
            CustomerVisible: false);

        var result = await _petShipments.AddDocumentAsync(
            pet.Id.ToString(), request, "user-1");

        Assert.NotNull(result);
        var stored = _context.ShipmentDocuments.Single(d => d.FileName == "invoice.pdf");
        // ShipmentDocument.FileUrl is a non-nullable string defaulting to
        // string.Empty, so null must never be persisted into it.
        Assert.Equal(string.Empty, stored.FileUrl);
    }

    #endregion

    #region A. Optional fields normalise to empty string

    [Fact]
    public async Task CustomerCreateAsync_WithOmittedPhoneAndAddress_StoresEmptyStrings()
    {
        var request = new CreateCustomerRequest(
            FirstName: "Sam",
            LastName: "Rivera",
            Email: "sam@example.com",
            Phone: null,                              // <-- optional
            Address: null);                           // <-- optional

        var result = await _customers.CreateAsync(request);

        Assert.NotNull(result);
        // CustomerResponse declares Phone/Address as non-nullable strings.
        Assert.Equal(string.Empty, result!.Phone);
        Assert.Equal(string.Empty, result.Address);

        var stored = _context.Customers.Single();
        Assert.Equal(string.Empty, stored.Phone);
        Assert.Equal(string.Empty, stored.Address);
    }

    [Fact]
    public async Task CustomerUpdateAsync_WithOmittedPhoneAndAddress_StoresEmptyStrings()
    {
        var create = new CreateCustomerRequest(
            FirstName: "Sam", LastName: "Rivera",
            Email: "sam@example.com", Phone: null, Address: null);
        var created = await _customers.CreateAsync(create);

        var update = new UpdateCustomerRequest(
            FirstName: "Samantha",
            LastName: "Rivera",
            Phone: null,                              // <-- optional
            Address: null);                           // <-- optional

        var result = await _customers.UpdateAsync(created!.Id, update);

        Assert.NotNull(result);
        Assert.Equal(string.Empty, result!.Phone);
        Assert.Equal(string.Empty, result.Address);
    }

    [Fact]
    public async Task RegisterAsync_WithOmittedPhoneAndAddress_StoresEmptyStrings()
    {
        var request = new RegisterRequest(
            FirstName: "Dana",
            LastName: "Okafor",
            Email: "dana@example.com",
            Password: "Str0ngPassw0rd!",
            Phone: null,                              // <-- optional
            Address: null);                           // <-- optional

        var result = await _auth.RegisterAsync(request);

        Assert.NotNull(result);
        // Both the User and the Customer row created by registration.
        var user = _context.Users.Single();
        var customer = _context.Customers.Single();
        Assert.Equal(string.Empty, user.Phone);
        Assert.Equal(string.Empty, customer.Phone);
        Assert.Equal(string.Empty, customer.Address);
    }

    [Fact]
    public async Task CustomerCreateAsync_WithSuppliedPhoneAndAddress_PreservesThem()
    {
        // Guards the other direction: the null-coalesce must not clobber real values.
        var request = new CreateCustomerRequest(
            FirstName: "Sam",
            LastName: "Rivera",
            Email: "sam@example.com",
            Phone: "+1 555 0199",
            Address: "42 Example St");

        var result = await _customers.CreateAsync(request);

        Assert.Equal("+1 555 0199", result!.Phone);
        Assert.Equal("42 Example St", result.Address);
    }

    #endregion
}
