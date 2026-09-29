using ShipNex.Application.DTOs;

namespace ShipNex.Application.Interfaces;

public interface IShipmentService
{
    Task<ShipmentResponse> CreateAsync(CreateShipmentRequest request, string userId = "");
    Task<ShipmentResponse?> GetByIdAsync(string id);
    Task<TrackingResponse?> GetByTrackingNumberAsync(string trackingNumber);
    /// <summary>Customer-safe public tracking view. Never includes private fields.</summary>
    Task<PublicShipmentTrackingResponse?> GetPublicTrackingAsync(string trackingNumber);
    Task<PagedResponse<ShipmentResponse>> GetFilteredAsync(ShipmentFilterRequest filter);
    Task<List<ShipmentResponse>> GetAllAsync();
    Task<ShipmentResponse?> UpdateStatusAsync(string id, UpdateShipmentStatusRequest request, string userId = "");
    Task<ShipmentResponse?> AddTrackingEventAsync(string id, AddTrackingEventRequest request, string userId = "");
    Task<bool> DeleteAsync(string id, string userId = "");
}
