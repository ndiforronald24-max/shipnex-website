using Microsoft.EntityFrameworkCore;
using ShipNex.Application.DTOs;
using ShipNex.Application.Interfaces;
using ShipNex.Domain.Entities;
using ShipNex.Domain.Enums;
using ShipNex.Infrastructure.Data;

namespace ShipNex.Infrastructure.Services;

public class PetShipmentService : IPetShipmentService
{
    private readonly ShipNexDbContext _context;
    private readonly ITrackingNumberGenerator _trackingGenerator;
    private readonly IAuditService _auditService;
    private readonly INotificationService _notificationService;
    private readonly ISupabaseRealtimeService? _realtimeService;

    public PetShipmentService(
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

    public async Task<PetShipmentResponse> CreateAsync(CreatePetShipmentRequest request, string userId = "")
    {
        var trackingNumber = await _trackingGenerator.GeneratePetTrackingNumberAsync();
        var pet = new PetShipment
        {
            TrackingNumber = trackingNumber,
            OwnerName = request.OwnerName,
            OwnerPhone = request.OwnerPhone,
            OwnerEmail = request.OwnerEmail,
            PetName = request.PetName,
            PetType = Enum.TryParse<PetType>(request.PetType, true, out var pt) ? pt : PetType.Other,
            PetBreed = request.PetBreed,
            PetAge = request.PetAge,
            PetGender = request.PetGender,
            Weight = request.Weight,
            MicrochipId = request.MicrochipId,
            PhotoUrl = request.PhotoUrl,
            Origin = request.Origin,
            Destination = request.Destination,
            ServiceType = request.ServiceType ?? "Standard",
            ShipmentType = request.ShipmentType ?? "PetTransport",
            VaccinationVerified = request.VaccinationVerified,
            HealthCertificate = request.HealthCertificate,
            SpecialInstructions = request.SpecialInstructions,
            CustomerVisibleInformation = request.CustomerVisibleInformation,
            EstimatedDelivery = request.EstimatedDelivery ?? DateTime.UtcNow.AddDays(5),
            JourneyStatus = PetJourneyStatus.Registered
        };
        _context.PetShipments.Add(pet);
        await _context.SaveChangesAsync();
        await _auditService.LogAsync("Created pet shipment " + trackingNumber, "Create", "PetShipment", pet.Id.ToString(), userId);
        return MapToResponse(pet);
    }

    public async Task<PetShipmentResponse?> GetByIdAsync(string id)
    {
        if (!Guid.TryParse(id, out var guid)) return null;
        var pet = await _context.PetShipments
            .Include(p => p.CareEvents)
            .Include(p => p.Documents)
            .FirstOrDefaultAsync(p => p.Id == guid && !p.IsDeleted);
        return pet == null ? null : MapToResponse(pet);
    }

    public async Task<PetShipmentResponse?> GetByTrackingNumberAsync(string trackingNumber)
    {
        var pet = await _context.PetShipments
            .Include(p => p.CareEvents)
            .Include(p => p.Documents)
            .FirstOrDefaultAsync(p => p.TrackingNumber == trackingNumber && !p.IsDeleted);
        return pet == null ? null : MapToResponse(pet);
    }

    public async Task<PublicPetTrackingResponse?> GetPublicTrackingAsync(string trackingNumber)
    {
        var pet = await _context.PetShipments
            .Include(p => p.CareEvents)
            .Include(p => p.Documents)
            .FirstOrDefaultAsync(p => p.TrackingNumber == trackingNumber && !p.IsDeleted);
        if (pet == null) return null;
        var careEvents = pet.CareEvents
            .Where(e => e.CustomerVisible)
            .OrderByDescending(e => e.EventTime)
            .Select(e => new PetCareEventResponse(
                e.Id.ToString(), e.LocationName ?? "", e.Description,
                e.Type.ToString(), e.CareStatus.ToString(), e.EventTime,
                e.Latitude, e.Longitude, e.CustomerVisible)).ToList();
        return new PublicPetTrackingResponse(
            pet.TrackingNumber,
            pet.JourneyStatus.ToString(),
            pet.PetName,
            pet.PetType.ToString(),
            pet.PetBreed,
            pet.PetAge,
            pet.PetGender,
            pet.Weight,
            pet.MicrochipId,
            pet.PhotoUrl,
            pet.Origin,
            pet.OriginLatitude,
            pet.OriginLongitude,
            pet.Destination,
            pet.DestinationLatitude,
            pet.DestinationLongitude,
            pet.CurrentLocationName,
            pet.CurrentLatitude,
            pet.CurrentLongitude,
            pet.EstimatedDelivery,
            pet.UpdatedAt,
            new List<PublicTrackingEventResponse>(),
            careEvents.Select(e => new PublicPetCareEventResponse(
                e.EventType.ToString(),
                e.CareStatus.ToString(),
                e.Description,
                e.LocationName ?? "",
                e.EventTime
            )).ToList(),
            // SECURITY: only documents explicitly marked customer-visible are
            // exposed publicly. Private veterinary/health records stay hidden.
            pet.Documents
                .Where(d => !d.IsDeleted && d.CustomerVisible)
                .OrderByDescending(d => d.CreatedAt)
                .Select(d => new PublicTrackingDocumentResponse(
                    d.DocumentNumber,
                    d.DocumentType,
                    d.FileName,
                    d.FileSize,
                    d.IssuedAt))
                .ToList()
        );
    }

    public async Task<List<PetShipmentResponse>> GetAllAsync()
    {
        var pets = await _context.PetShipments
            .Include(p => p.CareEvents)
            .Include(p => p.Documents)
            .Where(p => !p.IsDeleted)
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync();
        return pets.Select(MapToResponse).ToList();
    }

    public async Task<PetShipmentResponse?> UpdateAsync(string id, UpdatePetShipmentRequest request, string userId = "")
    {
        if (!Guid.TryParse(id, out var guid)) return null;
        var pet = await _context.PetShipments.FirstOrDefaultAsync(p => p.Id == guid && !p.IsDeleted);
        if (pet == null) return null;
        if (request.OwnerName != null) pet.OwnerName = request.OwnerName;
        if (request.PetName != null) pet.PetName = request.PetName;
        if (request.PetBreed != null) pet.PetBreed = request.PetBreed;
        if (request.EstimatedDelivery.HasValue) pet.EstimatedDelivery = request.EstimatedDelivery;
        pet.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        await _auditService.LogAsync("Updated pet shipment", "Update", "PetShipment", pet.Id.ToString(), userId);
        return await GetByIdAsync(id);
    }

    public async Task<PetShipmentResponse?> AddCareEventAsync(string id, AddPetCareEventRequest request, string userId = "")
    {
        if (!Guid.TryParse(id, out var guid)) return null;
        var pet = await _context.PetShipments.FirstOrDefaultAsync(p => p.Id == guid && !p.IsDeleted);
        if (pet == null) return null;
        var careEvent = new PetCareEvent
        {
            PetShipmentId = pet.Id,
            LocationName = request.LocationName,
            Description = request.Description,
            Type = Enum.TryParse<PetCareEventType>(request.EventType, true, out var et) ? et : PetCareEventType.ComfortCheck,
            CareStatus = PetCareEventStatus.Completed,
            EventTime = request.EventTime ?? DateTime.UtcNow,
            CustomerVisible = request.CustomerVisible
        };
        _context.PetCareEvents.Add(careEvent);
        await _context.SaveChangesAsync();
        await _auditService.LogAsync("Added pet care event", "Create", "PetCareEvent", null, userId);

        // SECURITY: only customer-visible care events may be broadcast.
        if (careEvent.CustomerVisible)
        {
            await PublishPetCareEventSafeAsync(pet, careEvent);
        }

        return await GetByIdAsync(id);
    }

    public async Task<PetShipmentResponse?> UpdateStatusAsync(string id, UpdatePetStatusRequest request, string userId = "")
    {
        if (!Guid.TryParse(id, out var guid)) return null;
        var pet = await _context.PetShipments.FirstOrDefaultAsync(p => p.Id == guid && !p.IsDeleted);
        if (pet == null) return null;
        if (Enum.TryParse<PetJourneyStatus>(request.JourneyStatus, true, out var parsed))
            pet.JourneyStatus = parsed;
        if (request.LocationName != null) pet.CurrentLocationName = request.LocationName;
        pet.UpdatedAt = DateTime.UtcNow;
        var statusEvent = new PetCareEvent
        {
            PetShipmentId = pet.Id,
            LocationName = request.LocationName ?? pet.CurrentLocationName,
            Description = request.Description ?? $"Status updated to {request.JourneyStatus}",
            Type = PetCareEventType.HealthCheck,
            CareStatus = PetCareEventStatus.Completed,
            EventTime = DateTime.UtcNow,
            CustomerVisible = true
        };
        _context.PetCareEvents.Add(statusEvent);
        await _context.SaveChangesAsync();
        await _auditService.LogAsync("Updated pet journey status", "Update", "PetShipment", pet.Id.ToString(), userId);

        // Journey status updates are customer-visible by design.
        await PublishPetCareEventSafeAsync(pet, statusEvent);

        return await GetByIdAsync(id);
    }

    public async Task<PetShipmentResponse?> UpdateLocationAsync(string id, UpdatePetLocationRequest request, string userId = "")
    {
        if (!Guid.TryParse(id, out var guid)) return null;
        var pet = await _context.PetShipments.FirstOrDefaultAsync(p => p.Id == guid && !p.IsDeleted);
        if (pet == null) return null;
        if (request.CurrentLocationName != null) pet.CurrentLocationName = request.CurrentLocationName;
        if (request.Latitude.HasValue) pet.CurrentLatitude = request.Latitude;
        if (request.Longitude.HasValue) pet.CurrentLongitude = request.Longitude;
        pet.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        await _auditService.LogAsync("Updated pet location", "Update", "PetShipment", pet.Id.ToString(), userId);

        // Broadcast the new customer-safe location for this journey.
        await PublishPetLocationSafeAsync(pet);

        return await GetByIdAsync(id);
    }

    public async Task<PetShipmentResponse?> AddDocumentAsync(string id, CreatePetDocumentRequest request, string userId = "")
    {
        if (!Guid.TryParse(id, out var guid)) return null;
        var pet = await _context.PetShipments.FirstOrDefaultAsync(p => p.Id == guid && !p.IsDeleted);
        if (pet == null) return null;
        var doc = new ShipmentDocument
        {
            PetShipmentId = pet.Id,
            DocumentType = request.DocumentType,
            FileName = request.FileName,
            FileUrl = request.FileUrl,
            FileSize = request.FileSize,
            CustomerVisible = request.CustomerVisible
        };
        _context.ShipmentDocuments.Add(doc);
        await _context.SaveChangesAsync();
        await _auditService.LogAsync("Added pet document", "Create", "ShipmentDocument", doc.Id.ToString(), userId);
        return await GetByIdAsync(id);
    }

    public async Task<PetShipmentResponse?> SetDocumentCustomerVisibleAsync(string petId, string documentId, bool customerVisible, string userId = "")
    {
        if (!Guid.TryParse(petId, out var petGuid)) return null;
        if (!Guid.TryParse(documentId, out var docGuid)) return null;
        var doc = await _context.ShipmentDocuments.FirstOrDefaultAsync(d => d.Id == docGuid && d.PetShipmentId == petGuid);
        if (doc == null) return null;
        doc.CustomerVisible = customerVisible;
        await _context.SaveChangesAsync();
        await _auditService.LogAsync($"Set document customer visible: {customerVisible}", "Update", "ShipmentDocument", doc.Id.ToString(), userId);
        var pet = await _context.PetShipments.FirstOrDefaultAsync(p => p.Id == petGuid);
        return pet == null ? null : MapToResponse(pet);
    }

    public async Task<bool> DeleteAsync(string id, string userId = "")
    {
        if (!Guid.TryParse(id, out var guid)) return false;
        var pet = await _context.PetShipments.FirstOrDefaultAsync(p => p.Id == guid && !p.IsDeleted);
        if (pet == null) return false;
        pet.IsDeleted = true;
        pet.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        await _auditService.LogAsync("Deleted pet shipment", "Delete", "PetShipment", pet.Id.ToString(), userId);
        return true;
    }

    /// <summary>
    /// Broadcasts a customer-visible care event over Supabase Realtime.
    /// Best-effort: the publisher logs its own failures and nothing here can
    /// break the underlying pet shipment operation.
    /// </summary>
    private async Task PublishPetCareEventSafeAsync(PetShipment pet, PetCareEvent careEvent)
    {
        if (_realtimeService == null) return;
        try
        {
            await _realtimeService.PublishPetCareEventAsync(
                pet.TrackingNumber,
                new PublicPetCareEventResponse(
                    careEvent.Type.ToString(),
                    careEvent.CareStatus.ToString(),
                    careEvent.Description,
                    careEvent.LocationName ?? string.Empty,
                    careEvent.EventTime));
        }
        catch
        {
            // Realtime is best-effort — tracking still works via REST refresh.
        }
    }

    /// <summary>
    /// Broadcasts a customer-safe location update for a pet journey.
    /// </summary>
    private async Task PublishPetLocationSafeAsync(PetShipment pet)
    {
        if (_realtimeService == null) return;
        try
        {
            await _realtimeService.PublishPetLocationUpdateAsync(
                pet.TrackingNumber,
                pet.CurrentLocationName ?? string.Empty,
                pet.CurrentLatitude,
                pet.CurrentLongitude,
                pet.UpdatedAt);
        }
        catch
        {
            // Realtime is best-effort — tracking still works via REST refresh.
        }
    }

    private static PetShipmentResponse MapToResponse(PetShipment pet)
    {
        return new PetShipmentResponse(
            pet.Id.ToString(), pet.TrackingNumber,
            pet.OwnerName, pet.OwnerPhone, pet.OwnerEmail,
            pet.PetName, pet.PetType.ToString(), pet.PetBreed,
            pet.PetAge, pet.PetGender, pet.Weight, pet.MicrochipId, pet.PhotoUrl,
            pet.Origin, pet.Destination,
            pet.OriginLatitude, pet.OriginLongitude,
            pet.DestinationLatitude, pet.DestinationLongitude,
            pet.CurrentLatitude, pet.CurrentLongitude,
            pet.CurrentLocationName, pet.JourneyStatus.ToString(),
            pet.CreatedAt, pet.EstimatedDelivery,
            pet.VaccinationVerified, pet.HealthCertificate,
            pet.SpecialInstructions, pet.CustomerVisibleInformation,
            pet.CarrierName, pet.ServiceType, pet.ShipmentType,
            pet.CareEvents?.OrderByDescending(e => e.EventTime).Select(e => new PetCareEventResponse(
                e.Id.ToString(), e.LocationName ?? "", e.Description,
                e.Type.ToString(), e.CareStatus.ToString(), e.EventTime,
                e.Latitude, e.Longitude, e.CustomerVisible)).ToList() ?? new List<PetCareEventResponse>(),
            pet.Documents?.Select(d => new PetDocumentResponse(
                d.Id.ToString(), null, d.DocumentType, d.FileName, d.FileUrl,
                d.ContentType, d.FileSize, d.Description, d.IssuedAt,
                d.CreatedAt, d.IsVerified, d.CustomerVisible)).ToList() ?? new List<PetDocumentResponse>()
        );
    }
}