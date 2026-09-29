using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using ShipNex.Domain.Entities;
using ShipNex.Infrastructure.Data;
using ShipNex.Api;
using Xunit;

namespace ShipNex.Api.Tests;

/// <summary>
/// In-process integration tests that boot the real API (InMemory DB + ProgramSeeder
/// seed) via WebApplicationFactory. These exercise the HTTP endpoints end-to-end
/// without needing a separately-running server.
/// </summary>
public class ApiIntegrationTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;

    public ApiIntegrationTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory.WithWebHostBuilder(builder =>
        {
            builder.UseEnvironment("Development");
            builder.ConfigureAppConfiguration((context, config) =>
            {
                config.AddInMemoryCollection(new Dictionary<string, string?>
                {
                    ["Jwt:SecretKey"] = "Test_ShipNex_SecretKey_ForIntegrationTests_Only_2026!",
                    // Tests log in repeatedly from the same IP; raise the auth rate
                    // limit so integration tests aren't throttled (prod default stays 5/60s).
                    ["RateLimit:MaxRequests"] = "10000",
                    ["RateLimit:WindowSeconds"] = "60"
                });
            });
        });
    }

    private HttpClient Client => _factory.CreateClient();

    [Fact]
    public async Task HealthCheck_ReturnsOk()
    {
        var res = await Client.GetAsync("/health");
        Assert.Equal(HttpStatusCode.OK, res.StatusCode);
    }

    [Fact]
    public async Task Offices_GetAll_ReturnsNonEmptyList()
    {
        var res = await Client.GetAsync("/api/offices");
        res.EnsureSuccessStatusCode();
        using var doc = await JsonDocument.ParseAsync(await res.Content.ReadAsStreamAsync());
        Assert.True(doc.RootElement.ValueKind == JsonValueKind.Array, "Expected a JSON array of offices");
        Assert.True(doc.RootElement.GetArrayLength() > 0, "Offices list should be seeded and non-empty");
    }

    [Fact]
    public async Task Auth_Login_Admin_ReturnsJwtToken()
    {
        var payload = new StringContent(
            JsonSerializer.Serialize(new { email = "admin@shipnex.com", password = "admin123" }),
            Encoding.UTF8, "application/json");

        var res = await Client.PostAsync("/api/auth/login", payload);
        res.EnsureSuccessStatusCode();
        using var doc = await JsonDocument.ParseAsync(await res.Content.ReadAsStreamAsync());
        Assert.True(doc.RootElement.TryGetProperty("token", out var token), "Login response must contain a token");
        Assert.False(string.IsNullOrWhiteSpace(token.GetString()), "Token must not be empty");
    }

    [Fact]
    public async Task Tracking_ByShipmentNumber_Returns200()
    {
        var trackingNumber = FirstShipmentTrackingNumber();
        var res = await Client.GetAsync($"/api/tracking/{trackingNumber}");
        res.EnsureSuccessStatusCode();
        using var doc = await JsonDocument.ParseAsync(await res.Content.ReadAsStreamAsync());
        Assert.Equal("shipment", doc.RootElement.GetProperty("type").GetString());
        Assert.True(doc.RootElement.TryGetProperty("result", out _));
    }

    [Fact]
    public async Task Tracking_ByPetNumber_Returns200()
    {
        var trackingNumber = FirstPetShipmentTrackingNumber();
        var res = await Client.GetAsync($"/api/tracking/{trackingNumber}");
        res.EnsureSuccessStatusCode();
        using var doc = await JsonDocument.ParseAsync(await res.Content.ReadAsStreamAsync());
        Assert.Equal("pet", doc.RootElement.GetProperty("type").GetString());
        Assert.True(doc.RootElement.TryGetProperty("result", out _));
    }

    [Fact]
    public async Task Tracking_UnknownNumber_Returns404()
    {
        var res = await Client.GetAsync("/api/tracking/USP-2099");
        Assert.Equal(HttpStatusCode.NotFound, res.StatusCode);
    }

    [Fact]
    public async Task Auth_Login_WithWrongPassword_Returns401()
    {
        var payload = new StringContent(
            JsonSerializer.Serialize(new { email = "admin@shipnex.com", password = "wrong-password" }),
            Encoding.UTF8, "application/json");
        var res = await Client.PostAsync("/api/auth/login", payload);
        Assert.Equal(HttpStatusCode.Unauthorized, res.StatusCode);
    }

    [Fact]
    public async Task Auth_Login_WithInvalidPayload_Returns400()
    {
        // Missing email and too-short password -> should be rejected by model validation.
        var payload = new StringContent(
            JsonSerializer.Serialize(new { email = "", password = "123" }),
            Encoding.UTF8, "application/json");
        var res = await Client.PostAsync("/api/auth/login", payload);
        Assert.Equal(HttpStatusCode.BadRequest, res.StatusCode);
    }

    [Fact]
    public async Task Offices_GetById_WithInvalidId_Returns404()
    {
        var res = await Client.GetAsync("/api/offices/00000000-0000-0000-0000-000000000000");
        Assert.Equal(HttpStatusCode.NotFound, res.StatusCode);
    }

    // ---------- Admin dashboard: list endpoints ----------

    [Fact]
    public async Task Shipments_GetAll_ReturnsNonEmptyList()
    {
        // The shipments list is admin-only (see Customers_GetAll_WithoutToken_Returns401),
        // so the dashboard list must be requested with a valid staff token.
        var client = await CreateAuthorizedClientAsync();
        var res = await client.GetAsync("/api/shipments");
        res.EnsureSuccessStatusCode();
        using var doc = await JsonDocument.ParseAsync(await res.Content.ReadAsStreamAsync());
        Assert.True(doc.RootElement.ValueKind == JsonValueKind.Array, "Expected a JSON array of shipments");
        Assert.True(doc.RootElement.GetArrayLength() > 0, "Shipments list should be seeded and non-empty");
    }

    [Fact]
    public async Task Customers_GetAll_WithoutToken_Returns401()
    {
        var res = await Client.GetAsync("/api/customers");
        Assert.Equal(HttpStatusCode.Unauthorized, res.StatusCode);
    }

    [Fact]
    public async Task Customers_GetAll_WithToken_ReturnsNonEmptyList()
    {
        var client = await CreateAuthorizedClientAsync();
        var res = await client.GetAsync("/api/customers");
        res.EnsureSuccessStatusCode();
        using var doc = await JsonDocument.ParseAsync(await res.Content.ReadAsStreamAsync());
        Assert.True(doc.RootElement.ValueKind == JsonValueKind.Array, "Expected a JSON array of customers");
        Assert.True(doc.RootElement.GetArrayLength() > 0, "Customers list should be seeded and non-empty");
    }

    [Fact]
    public async Task Pets_GetAll_WithToken_ReturnsNonEmptyList()
    {
        var client = await CreateAuthorizedClientAsync();
        var res = await client.GetAsync("/api/pets");
        res.EnsureSuccessStatusCode();
        using var doc = await JsonDocument.ParseAsync(await res.Content.ReadAsStreamAsync());
        Assert.True(doc.RootElement.ValueKind == JsonValueKind.Array, "Expected a JSON array of pet shipments");
        Assert.True(doc.RootElement.GetArrayLength() > 0, "Pet shipments list should be seeded and non-empty");
    }

    // ---------- Admin dashboard: customer CRUD (regression: Guid key lookup) ----------

    [Fact]
    public async Task Customer_Create_GetById_Update_Delete_FullFlow()
    {
        var client = await CreateAuthorizedClientAsync();

        // Create
        var createPayload = new StringContent(
            JsonSerializer.Serialize(new
            {
                firstName = "Integration",
                lastName = "Tester",
                email = "integration.tester@shipnex.test",
                phone = "+1-555-0100",
                address = "1 Test Way"
            }),
            Encoding.UTF8, "application/json");
        var createRes = await client.PostAsync("/api/customers", createPayload);
        Assert.Equal(HttpStatusCode.Created, createRes.StatusCode);
        using (var doc = await JsonDocument.ParseAsync(await createRes.Content.ReadAsStreamAsync()))
        {
            var id = doc.RootElement.GetProperty("id").GetString();
            Assert.False(string.IsNullOrWhiteSpace(id), "Created customer must expose its id");

            // GetById (would previously throw 500: string key passed to Guid FindAsync)
            var getRes = await client.GetAsync($"/api/customers/{id}");
            Assert.Equal(HttpStatusCode.OK, getRes.StatusCode);
            using var getDoc = await JsonDocument.ParseAsync(await getRes.Content.ReadAsStreamAsync());
            Assert.Equal("Integration", getDoc.RootElement.GetProperty("firstName").GetString());

            // Update
            var updatePayload = new StringContent(
                JsonSerializer.Serialize(new
                {
                    firstName = "Integration",
                    lastName = "Tester-Updated",
                    phone = "+1-555-0101",
                    address = "2 Test Way"
                }),
                Encoding.UTF8, "application/json");
            var updateRes = await client.PutAsync($"/api/customers/{id}", updatePayload);
            Assert.Equal(HttpStatusCode.OK, updateRes.StatusCode);
            using var updDoc = await JsonDocument.ParseAsync(await updateRes.Content.ReadAsStreamAsync());
            Assert.Equal("Tester-Updated", updDoc.RootElement.GetProperty("lastName").GetString());

            // Delete
            var deleteRes = await client.DeleteAsync($"/api/customers/{id}");
            Assert.Equal(HttpStatusCode.NoContent, deleteRes.StatusCode);

            // GetById now 404
            var goneRes = await client.GetAsync($"/api/customers/{id}");
            Assert.Equal(HttpStatusCode.NotFound, goneRes.StatusCode);
        }
    }

    [Fact]
    public async Task Customer_GetById_WithInvalidGuid_Returns404()
    {
        var client = await CreateAuthorizedClientAsync();
        var res = await client.GetAsync("/api/customers/not-a-guid");
        Assert.Equal(HttpStatusCode.NotFound, res.StatusCode);
    }

    // ---------- Admin dashboard: shipment status update ----------

    [Fact]
    public async Task Shipment_UpdateStatus_AddsTrackingEvent()
    {
        var client = await CreateAuthorizedClientAsync();
        var shipmentId = FirstShipmentId();

        var payload = new StringContent(
            JsonSerializer.Serialize(new
            {
                status = "ShipmentCreated",
                location = "Integration Test Hub",
                description = "Status updated by integration test"
            }),
            Encoding.UTF8, "application/json");
        var res = await client.PutAsync($"/api/shipments/{shipmentId}/status", payload);
        if (!res.IsSuccessStatusCode)
        {
            var body = await res.Content.ReadAsStringAsync();
            throw new Exception($"PUT /shipments/{shipmentId}/status failed {(int)res.StatusCode}: {body}");
        }
        res.EnsureSuccessStatusCode();
        using var doc = await JsonDocument.ParseAsync(await res.Content.ReadAsStreamAsync());
        var root = doc.RootElement;

        var location = root.EnumerateObject()
            .FirstOrDefault(p => string.Equals(p.Name, "currentLocation", StringComparison.OrdinalIgnoreCase));
        Assert.True(location.Value.ValueKind != JsonValueKind.Undefined, "Response must contain currentLocation");
        Assert.Equal("Integration Test Hub", location.Value.GetString());

        var eventsProp = root.EnumerateObject()
            .FirstOrDefault(p => string.Equals(p.Name, "events", StringComparison.OrdinalIgnoreCase));
        Assert.True(eventsProp.Value.ValueKind == JsonValueKind.Array, "Response must contain events");
        Assert.True(eventsProp.Value.GetArrayLength() >= 2, "Tracking event should be appended");
    }

    [Fact]
    public async Task Shipment_UpdateStatus_DirectContext_Diagnose()
    {
        using var scope = _factory.Services.CreateScope();
        var ctx = scope.ServiceProvider.GetRequiredService<ShipNexDbContext>();

        var shipment = ctx.Shipments.Include(s => s.TrackingEvents).OrderBy(s => s.Id).First();
        shipment.CurrentLocationName = "Diag Hub";
        shipment.UpdatedAt = DateTime.UtcNow;
        shipment.Status = Enum.TryParse<ShipNex.Domain.Enums.ShipmentStatus>("ShipmentCreated", true, out var parsed)
            ? parsed : shipment.Status;
        // Regression: must add via DbSet — adding a new entity with a client-set Guid key
        // through a navigation collection makes change detection mark it Modified,
        // which throws DbUpdateConcurrencyException on save (InMemory + relational).
        ctx.ShipmentTrackingEvents.Add(new ShipmentTrackingEvent
        {
            ShipmentId = shipment.Id,
            Location = "Diag Hub",
            Description = "diag",
            Status = shipment.Status,
            Timestamp = DateTime.UtcNow
        });

        var snapshot = ctx.ChangeTracker.Entries()
            .Select(e => string.Concat(
                e.Metadata.DisplayName(), " state=", e.State,
                " pk=", string.Join(",", e.Metadata.FindPrimaryKey()?.Properties.Select(p => p.Name) ?? new[] { "none" })))
            .ToList();

        try
        {
            await ctx.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException ex)
        {
            var failing = string.Join("; ", ex.Entries.Select(e =>
                string.Concat(e.Metadata.DisplayName(), " pk=",
                    string.Join(",", e.Metadata.FindPrimaryKey()?.Properties.Select(p => p.Name) ?? new[] { "none" }))));
            var storeShipments = string.Join(", ", ctx.Shipments.IgnoreQueryFilters().Select(s => s.Id));
            throw new Exception(
                $"SNAPSHOT: [{string.Join(" | ", snapshot)}] " +
                $"FAILING: [{failing}] STORE_SHIPMENTS: [{storeShipments}]");
        }
        }

    // ---------- New shipment management endpoints ----------

    [Fact]
    public async Task Shipments_Filtered_ReturnsPagedResult()
    {
        var client = await CreateAuthorizedClientAsync();
        var res = await client.GetAsync("/api/shipments/filtered?status=InTransit&page=1&pageSize=10");
        res.EnsureSuccessStatusCode();
        using var doc = await JsonDocument.ParseAsync(await res.Content.ReadAsStreamAsync());
        var root = doc.RootElement;
        Assert.True(root.TryGetProperty("items", out var _), "Paged response must contain items");
        Assert.True(root.TryGetProperty("totalCount", out var _), "Paged response must contain totalCount");
        Assert.True(root.TryGetProperty("totalPages", out var _), "Paged response must contain totalPages");
    }

    [Fact]
    public async Task Shipments_GetById_Existing_Returns200()
    {
        var client = await CreateAuthorizedClientAsync();
        var shipmentId = FirstShipmentId();
        var res = await client.GetAsync($"/api/shipments/{shipmentId}");
        res.EnsureSuccessStatusCode();
        using var doc = await JsonDocument.ParseAsync(await res.Content.ReadAsStreamAsync());
        Assert.True(doc.RootElement.TryGetProperty("trackingNumber", out var _), "Shipment response must contain trackingNumber");
    }

    [Fact]
    public async Task Shipments_GetById_InvalidId_Returns404()
    {
        var client = await CreateAuthorizedClientAsync();
        var res = await client.GetAsync("/api/shipments/not-a-guid");
        Assert.Equal(HttpStatusCode.NotFound, res.StatusCode);
    }

    [Fact]
    public async Task Shipments_Create_ValidRequest_Returns201()
    {
        var client = await CreateAuthorizedClientAsync();
        var payload = new StringContent(
            JsonSerializer.Serialize(new
            {
                senderName = "Test Sender",
                senderAddress = "123 Sender St, Boston",
                receiverName = "Test Receiver",
                receiverAddress = "456 Receiver Ave, Miami",
                origin = "Boston",
                destination = "Miami",
                weight = 5.5,
                numberOfPieces = 2,
                serviceType = "Express",
                referenceNumber = "TEST-REF-001",
                notes = "Integration test shipment"
            }),
            Encoding.UTF8, "application/json");

        var res = await client.PostAsync("/api/shipments", payload);
        Assert.Equal(HttpStatusCode.Created, res.StatusCode);
        using var doc = await JsonDocument.ParseAsync(await res.Content.ReadAsStreamAsync());
        Assert.True(doc.RootElement.TryGetProperty("trackingNumber", out var _), "Created shipment must contain trackingNumber");
        Assert.True(doc.RootElement.TryGetProperty("weight", out var _), "Created shipment must contain weight");
    }

    [Fact]
    public async Task Shipments_AddTrackingEvent_ExistingShipment_Returns200()
    {
        var client = await CreateAuthorizedClientAsync();
        var shipmentId = FirstShipmentId();

        var payload = new StringContent(
            JsonSerializer.Serialize(new
            {
                status = "InTransit",
                locationName = "Test Tracking Location",
                latitude = 40.7128,
                longitude = -74.0060,
                description = "Test tracking event from integration test",
                eventTime = DateTime.UtcNow
            }),
            Encoding.UTF8, "application/json");

        var res = await client.PostAsync($"/api/shipments/{shipmentId}/tracking-events", payload);
        if (!res.IsSuccessStatusCode)
        {
            var body = await res.Content.ReadAsStringAsync();
            throw new Exception($"POST /api/shipments/{shipmentId}/tracking-events failed {(int)res.StatusCode}: {body}");
        }
        res.EnsureSuccessStatusCode();
        using var doc = await JsonDocument.ParseAsync(await res.Content.ReadAsStreamAsync());
        var eventsProp = doc.RootElement.GetProperty("events");
        Assert.True(eventsProp.GetArrayLength() >= 2, "Should have initial + new tracking events");
    }

    private string FirstShipmentTrackingNumber()
    {
        using var scope = _factory.Services.CreateScope();
        var ctx = scope.ServiceProvider.GetRequiredService<ShipNexDbContext>();
        return ctx.Shipments.OrderBy(s => s.Id).First().TrackingNumber;
    }
    private string FirstPetShipmentTrackingNumber()
    {
        using var scope = _factory.Services.CreateScope();
        var ctx = scope.ServiceProvider.GetRequiredService<ShipNexDbContext>();
        return ctx.PetShipments.OrderBy(p => p.Id).First().TrackingNumber;
    }

    private Guid FirstShipmentId()
    {
        using var scope = _factory.Services.CreateScope();
        var ctx = scope.ServiceProvider.GetRequiredService<ShipNexDbContext>();
        return ctx.Shipments.OrderBy(s => s.Id).First().Id;
    }

    /// <summary>Creates a fresh HttpClient with a Bearer token obtained from the seeded admin login.</summary>
    private async Task<HttpClient> CreateAuthorizedClientAsync()
    {
        var token = await GetAdminTokenAsync();
        var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        return client;
    }

    private async Task<string> GetAdminTokenAsync()
    {
        var payload = new StringContent(
            JsonSerializer.Serialize(new { email = "admin@shipnex.com", password = "admin123" }),
            Encoding.UTF8, "application/json");
        var res = await Client.PostAsync("/api/auth/login", payload);
        res.EnsureSuccessStatusCode();
        using var doc = await JsonDocument.ParseAsync(await res.Content.ReadAsStreamAsync());
        return doc.RootElement.GetProperty("token").GetString()
            ?? throw new InvalidOperationException("Login succeeded but token was null");
    }
}
