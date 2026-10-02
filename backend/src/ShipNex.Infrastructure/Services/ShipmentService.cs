using Microsoft.EntityFrameworkCore;
using ShipNex.Application.DTOs;
using ShipNex.Application.Interfaces;
using ShipNex.Application.Mapping;
using ShipNex.Domain.Entities;
using ShipNex.Domain.Enums;
using ShipNex.Domain.ValueObjects;
using ShipNex.Infrastructure.Data;

namespace ShipNex.Infrastructure.Services;

public class ShipmentService : IShipmentService
{
    private readonly ShipNexDbContext _context;
    private readonly ITrackingNumberGenerator _trackingGenerator;
    private readonly IAuditService _auditService;
    private readonly INotificationService _notificationService;
    private readonly ISupabaseRealtimeService? _realtimeService;

    // Transactions are only meaningful/supported on relational providers
    // (PostgreSQL in production). The in-memory store (development/tests)
    // ignores them, so we skip creating one there.
    private bool SupportsTransactions =>
        !string.Equals(_context.Database.ProviderName, "Microsoft.EntityFrameworkCore.InMemory", StringComparison.OrdinalIgnoreCase);

    public ShipmentService(
        ShipNexDbContext context,
        ITrackingNumberGenerator trackingGenerator,
        IAuditService auditService,
        INotificationService notificationService,
        ISupabaseRealtimeService? realtimeService = null)
    {
        _context = context;
        _trackingGenerator = trackingGenerator;
        _auditService = auditService;
        _notificationService = notificationService;
        _realtimeService = realtimeService;
    }

    public async Task<ShipmentResponse> CreateAsync(CreateShipmentRequest request, string userId = "")
    {
        // Parse shipment type
        var shipmentType = ShipmentType.Standard;
        if (!string.IsNullOrEmpty(request.ShipmentType) && Enum.TryParse<ShipmentType>(request.ShipmentType, true, out var parsedType))
            shipmentType = parsedType;

        // Generate tracking number
        var trackingNumber = shipmentType == ShipmentType.PetTransport
            ? await _trackingGenerator.GeneratePetTrackingNumberAsync()
            : await _trackingGenerator.GenerateShipmentTrackingNumberAsync();

        // Use database transaction for atomic operations (relational providers only)
        await using var transaction = SupportsTransactions
            ? await _context.Database.BeginTransactionAsync()
            : null;
        try
        {
            var shipment = new Shipment
            {
                TrackingNumber = trackingNumber,
                CustomerId = request.CustomerId ?? Guid.Empty,
                ShipmentType = shipmentType,
                ServiceType = request.ServiceType,
                SenderName = request.SenderName,
                SenderAddress = request.SenderAddress,
                ReceiverName = request.ReceiverName,
                ReceiverAddress = request.ReceiverAddress,
                Origin = request.Origin,
                Destination = request.Destination,
                OriginLatitude = request.OriginLatitude,
                OriginLongitude = request.OriginLongitude,
                DestinationLatitude = request.DestinationLatitude,
                DestinationLongitude = request.DestinationLongitude,
                Status = ShipmentStatus.ShipmentCreated,
                CurrentLocationName = request.Origin,
                // Seed the live position from the origin when we know it, so the map
                // shows a marker from the moment the shipment exists rather than
                // only after the first staff-entered tracking event.
                CurrentLatitude = request.OriginLatitude,
                CurrentLongitude = request.OriginLongitude,
                Weight = request.Weight,
                NumberOfPieces = request.NumberOfPieces,
                ReferenceNumber = request.ReferenceNumber ?? string.Empty,
                ShippingCost = new Money(0),
                Tracking = new TrackingInfo(),
                EstimatedDelivery = request.EstimatedDelivery ?? DateTime.UtcNow.AddDays(request.ServiceType == "Express" ? 2 : 5),
            };

            _context.Shipments.Add(shipment);

            // Create initial tracking event
            _context.ShipmentTrackingEvents.Add(new ShipmentTrackingEvent
            {
                ShipmentId = shipment.Id,
                Location = request.Origin,
                Description = "Shipment registered and created",
                Status = ShipmentStatus.ShipmentCreated,
                Timestamp = DateTime.UtcNow
            });

            await _context.SaveChangesAsync();

            // Create audit log
            await _auditService.LogAsync(
                "Shipment created",
                AuditActionType.Create.ToString(),
                nameof(Shipment),
                shipment.Id.ToString(),
                userId,
                $"TrackingNumber: {trackingNumber}, Origin: {request.Origin}, Destination: {request.Destination}");

            // Create notification
            await _notificationService.CreateAsync(new CreateNotificationRequest(
                Type: NotificationType.ShipmentStatusUpdate.ToString(),
                Title: "Shipment Created",
                Message: $"Your shipment {trackingNumber} has been created and is being processed.",
                RecipientEmail: null,
                RecipientPhone: null));

            if (transaction != null)
                await transaction.CommitAsync();

            // Reload to get tracking events
            await _context.Entry(shipment).Collection(s => s.TrackingEvents).LoadAsync();
            return MapToResponse(shipment);
        }
        catch (Exception ex)
        {
            if (transaction != null)
                await transaction.RollbackAsync();
            await _auditService.LogAsync(
                "Shipment creation failed",
                AuditActionType.Create.ToString(),
                nameof(Shipment),
                null,
                userId,
                $"Error: {ex.Message}",
                false);
            throw;
        }
    }

        public async Task<ShipmentResponse?> GetByIdAsync(string id)
    {
        if (!Guid.TryParse(id, out var guid)) return null;
        var shipment = await _context.Shipments
            .Include(s => s.TrackingEvents)
            .FirstOrDefaultAsync(s => s.Id == guid && !s.IsDeleted);
        return shipment == null ? null : MapToResponse(shipment);
    }

    public async Task<TrackingResponse?> GetByTrackingNumberAsync(string trackingNumber)
    {
        var shipment = await _context.Shipments
            .Include(s => s.TrackingEvents)
            .FirstOrDefaultAsync(s => s.TrackingNumber == trackingNumber && !s.IsDeleted);
        if (shipment == null) return null;

        // Fall back to the latest reported tracking event location when no
        // explicit current location has been recorded yet, so the customer
        // always sees the most recent location we know about.
        var currentLocation = string.IsNullOrWhiteSpace(shipment.CurrentLocationName)
            ? shipment.TrackingEvents
                .OrderByDescending(e => e.Timestamp)
                .FirstOrDefault()?.Location ?? string.Empty
            : shipment.CurrentLocationName;

        return new TrackingResponse(
            shipment.TrackingNumber,
            shipment.Status.ToString(),
            currentLocation,
            shipment.Origin,
            shipment.Destination,
            shipment.CreatedAt,
            shipment.EstimatedDelivery,
            shipment.TrackingEvents.Select(MapEvent).ToList()
        );
    }

        public async Task<PagedResponse<ShipmentResponse>> GetFilteredAsync(ShipmentFilterRequest filter)
    {
        var query = _context.Shipments
            .Include(s => s.TrackingEvents)
            .Where(s => !s.IsDeleted)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(filter.TrackingNumber))
            query = query.Where(s => s.TrackingNumber.Contains(filter.TrackingNumber));

        if (!string.IsNullOrWhiteSpace(filter.CustomerId) && Guid.TryParse(filter.CustomerId, out var customerGuid))
            query = query.Where(s => s.CustomerId == customerGuid);

        if (!string.IsNullOrWhiteSpace(filter.Status) && Enum.TryParse<ShipmentStatus>(filter.Status, true, out var status))
            query = query.Where(s => s.Status == status);

        if (!string.IsNullOrWhiteSpace(filter.Origin))
            query = query.Where(s => s.Origin.Contains(filter.Origin));

        if (!string.IsNullOrWhiteSpace(filter.Destination))
            query = query.Where(s => s.Destination.Contains(filter.Destination));

        if (filter.FromDate.HasValue)
            query = query.Where(s => s.CreatedAt >= filter.FromDate.Value);

        if (filter.ToDate.HasValue)
            query = query.Where(s => s.CreatedAt <= filter.ToDate.Value);

        var totalCount = await query.CountAsync();

        var items = await query
            .OrderByDescending(s => s.CreatedAt)
            .Skip((filter.Page - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .Select(s => MapToResponse(s))
            .ToListAsync();

        return new PagedResponse<ShipmentResponse>(
            items,
            totalCount,
            filter.Page,
            filter.PageSize,
            (int)Math.Ceiling(totalCount / (double)filter.PageSize)
        );
    }

    public async Task<List<ShipmentResponse>> GetAllAsync()
    {
        var shipments = await _context.Shipments
            .Include(s => s.TrackingEvents)
            .Where(s => !s.IsDeleted)
            .OrderByDescending(s => s.CreatedAt)
            .ToListAsync();
        return shipments.Select(MapToResponse).ToList();
    }

        public async Task<ShipmentResponse?> UpdateStatusAsync(string id, UpdateShipmentStatusRequest request, string userId = "")
    {
        if (!Guid.TryParse(id, out var guid)) return null;

        await using var transaction = SupportsTransactions
            ? await _context.Database.BeginTransactionAsync()
            : null;
        try
        {
            var shipment = await _context.Shipments
                .Include(s => s.TrackingEvents)
                .FirstOrDefaultAsync(s => s.Id == guid && !s.IsDeleted);
            if (shipment == null) return null;

            var oldStatus = shipment.Status;

            if (Enum.TryParse<ShipmentStatus>(request.Status, true, out var parsedStatus))
                shipment.Status = parsedStatus;

            shipment.CurrentLocationName = request.Location;
            shipment.UpdatedAt = DateTime.UtcNow;
            // NOTE: add via DbSet (not the navigation collection) — entities discovered
            // through change detection with client-set Guid keys are marked Modified,
            // which fails on save (DbUpdateConcurrencyException).
            var statusEvent = new ShipmentTrackingEvent
            {
                ShipmentId = shipment.Id,
                Location = request.Location,
                Description = request.Description ?? string.Empty,
                Status = shipment.Status,
                Timestamp = DateTime.UtcNow
            };
            _context.ShipmentTrackingEvents.Add(statusEvent);

            await _context.SaveChangesAsync();

            // Audit log
            await _auditService.LogAsync(
                "Shipment status updated",
                AuditActionType.StatusChange.ToString(),
                nameof(Shipment),
                shipment.Id.ToString(),
                userId,
                $"Status: {oldStatus} -> {shipment.Status}, Location: {request.Location}");

            // Create notification
            await _notificationService.CreateAsync(new CreateNotificationRequest(
                Type: NotificationType.ShipmentStatusUpdate.ToString(),
                Title: "Shipment Status Updated",
                Message: $"Your shipment {shipment.TrackingNumber} status has been updated to {shipment.Status} at {request.Location}",
                RecipientEmail: null,
                RecipientPhone: null));

            if (transaction != null)
                await transaction.CommitAsync();

            // Publish customer-safe realtime updates (best-effort).
            await PublishRealtimeUpdatesAsync(shipment, statusEvent);

            return MapToResponse(shipment);
        }
        catch (Exception ex)
        {
            if (transaction != null)
                await transaction.RollbackAsync();
            await _auditService.LogAsync(
                "Shipment status update failed",
                AuditActionType.StatusChange.ToString(),
                nameof(Shipment),
                id,
                userId,
                $"Error: {ex.Message}",
                false);
            throw;
        }
    }

        public async Task<ShipmentResponse?> AddTrackingEventAsync(string id, AddTrackingEventRequest request, string userId = "")
    {
        if (!Guid.TryParse(id, out var guid)) return null;

        await using var transaction = SupportsTransactions
            ? await _context.Database.BeginTransactionAsync()
            : null;
        try
        {
            var shipment = await _context.Shipments
                .Include(s => s.TrackingEvents)
                .FirstOrDefaultAsync(s => s.Id == guid && !s.IsDeleted);
            if (shipment == null) return null;

            // Parse and update status
            if (Enum.TryParse<ShipmentStatus>(request.Status, true, out var parsedStatus))
                shipment.Status = parsedStatus;

            shipment.CurrentLocationName = request.LocationName;
            shipment.UpdatedAt = DateTime.UtcNow;

            // Mirror the coordinates onto the shipment, not just the event. The public
            // tracking DTO reads Shipment.CurrentLatitude/Longitude for the live map
            // marker, so without this they stay null forever even though every
            // TrackingEvent carries its own lat/lng. PetShipmentService already does
            // this (see its AddTrackingEventAsync); shipments did not.
            if (request.Latitude.HasValue) shipment.CurrentLatitude = request.Latitude;
            if (request.Longitude.HasValue) shipment.CurrentLongitude = request.Longitude;

            // Create tracking event via DbSet to avoid concurrency issues
            var trackingEvent = new ShipmentTrackingEvent
            {
                ShipmentId = shipment.Id,
                Location = request.LocationName,
                Description = request.Description ?? string.Empty,
                Status = shipment.Status,
                Latitude = request.Latitude,
                Longitude = request.Longitude,
                Timestamp = request.EventTime ?? DateTime.UtcNow
            };

            _context.ShipmentTrackingEvents.Add(trackingEvent);
            await _context.SaveChangesAsync();

            // Audit log
            await _auditService.LogAsync(
                "Tracking event added",
                AuditActionType.Update.ToString(),
                nameof(ShipmentTrackingEvent),
                trackingEvent.Id.ToString(),
                userId,
                $"Status: {request.Status}, Location: {request.LocationName}");

            // Create notification
            await _notificationService.CreateAsync(new CreateNotificationRequest(
                Type: NotificationType.ShipmentStatusUpdate.ToString(),
                Title: "Shipment Update",
                Message: $"Your shipment {shipment.TrackingNumber} status: {request.Status} at {request.LocationName}",
                RecipientEmail: null,
                RecipientPhone: null));

            if (transaction != null)
                await transaction.CommitAsync();

            // Reload tracking events
            await _context.Entry(shipment).Collection(s => s.TrackingEvents).LoadAsync();

            // Publish customer-safe realtime updates (best-effort).
            await PublishRealtimeUpdatesAsync(shipment, trackingEvent);

            return MapToResponse(shipment);
        }
        catch (Exception ex)
        {
            if (transaction != null)
                await transaction.RollbackAsync();
            await _auditService.LogAsync(
                "Tracking event creation failed",
                AuditActionType.Update.ToString(),
                nameof(ShipmentTrackingEvent),
                null,
                userId,
                $"Error: {ex.Message}",
                false);
            throw;
        }
    }

    public async Task<bool> DeleteAsync(string id, string userId = "")
    {
        if (!Guid.TryParse(id, out var guid)) return false;

        var shipment = await _context.Shipments.FindAsync(guid);
        if (shipment == null) return false;

        shipment.IsDeleted = true;
        shipment.DeletedAt = DateTime.UtcNow;
        shipment.UpdatedBy = Guid.TryParse(userId, out var u) ? u : null;
        await _context.SaveChangesAsync();

        await _auditService.LogAsync(
            "Shipment deleted",
            AuditActionType.Delete.ToString(),
            nameof(Shipment),
            id,
            userId,
            $"TrackingNumber: {shipment.TrackingNumber}");

        return true;
    }

        private static ShipmentEventResponse MapEvent(ShipmentTrackingEvent e) =>
        new(e.Location, e.Description, e.Status.ToString(), e.Timestamp);

    /// <summary>
    /// Customer-safe public tracking view built straight from the entity,
    /// so no private fields can leak through the staff/internal mappers.
    /// </summary>
    public async Task<PublicShipmentTrackingResponse?> GetPublicTrackingAsync(string trackingNumber)
    {
        var shipment = await _context.Shipments
            .Include(s => s.TrackingEvents)
            .Include(s => s.Documents)
            .FirstOrDefaultAsync(s => s.TrackingNumber == trackingNumber);
        if (shipment == null) return null;

        var timeline = shipment.TrackingEvents
            .OrderByDescending(e => e.Timestamp)
            .Select(e => new PublicTrackingEventResponse(
                e.Status.ToString(),
                e.Location ?? string.Empty,
                e.Description,
                e.Timestamp,
                e.Latitude,
                e.Longitude))
            .ToList();

        var documents = shipment.Documents
            // SECURITY: only documents explicitly marked customer-visible may
            // appear on the public tracking page. Veterinary, health and
            // vaccination documents default to private.
            .Where(d => !d.IsDeleted && d.IsVerified && d.CustomerVisible)
            .OrderByDescending(d => d.CreatedAt)
            .Select(d => new PublicTrackingDocumentResponse(
                d.DocumentNumber,
                d.DocumentType,
                d.FileName,
                d.FileSize,
                d.IssuedAt))
            .ToList();

        // Customer-safe current location: explicit value when recorded,
        // otherwise the latest reported event location (never internal notes).
        var currentLocationName = string.IsNullOrWhiteSpace(shipment.CurrentLocationName)
            ? timeline.FirstOrDefault()?.LocationName ?? string.Empty
            : shipment.CurrentLocationName;

        return new PublicShipmentTrackingResponse(
            shipment.TrackingNumber,
            shipment.Status.ToString(),
            shipment.Origin ?? string.Empty,
            shipment.OriginLatitude,
            shipment.OriginLongitude,
            shipment.Destination ?? string.Empty,
            shipment.DestinationLatitude,
            shipment.DestinationLongitude,
            currentLocationName,
            shipment.CurrentLatitude,
            shipment.CurrentLongitude,
            shipment.EstimatedDelivery,
            shipment.ShipmentType.ToString(),
            shipment.ServiceType ?? string.Empty,
            shipment.Weight,
            shipment.NumberOfPieces,
            shipment.ReferenceNumber,
            shipment.UpdatedAt,
            timeline,
            documents);
    }

    /// <summary>
    /// Publishes customer-safe realtime updates for a shipment after a successful
    /// mutation. Realtime is a best-effort enhancement: the publisher logs its own
    /// failures, and any error here is swallowed so the shipment operation itself
    /// always succeeds and tracking keeps working through normal REST refresh.
    /// </summary>
    private async Task PublishRealtimeUpdatesAsync(Shipment shipment, ShipmentTrackingEvent? trackingEvent)
    {
        if (_realtimeService == null) return;

        try
        {
            if (trackingEvent != null)
            {
                await _realtimeService.PublishTrackingEventAsync(
                    shipment.TrackingNumber,
                    new PublicTrackingEventResponse(
                        trackingEvent.Status.ToString(),
                        trackingEvent.Location ?? string.Empty,
                        trackingEvent.Description,
                        trackingEvent.Timestamp,
                        trackingEvent.Latitude,
                        trackingEvent.Longitude));
            }

            // Full customer-safe snapshot so listeners update in one round trip.
            var snapshot = await GetPublicTrackingAsync(shipment.TrackingNumber);
            if (snapshot != null)
            {
                await _realtimeService.PublishShipmentUpdateAsync(shipment.TrackingNumber, snapshot);
            }
        }
        catch
        {
            // Never let realtime failures break the shipment operation.
        }
    }

    private static ShipmentResponse MapToResponse(Shipment s) => new(
        s.Id.ToString(),
        s.TrackingNumber,
        s.SenderName,
        s.ReceiverName,
        s.Origin,
        s.Destination,
        s.Status.ToString(),
        s.CurrentLocationName,
        s.Weight,
        s.NumberOfPieces,
        s.ServiceType,
        s.ReferenceNumber,
        s.CreatedAt,
        s.EstimatedDelivery,
        s.TrackingEvents.Select(MapEvent).ToList(),
        s.CustomerId == Guid.Empty ? null : s.CustomerId.ToString()
    );
}
