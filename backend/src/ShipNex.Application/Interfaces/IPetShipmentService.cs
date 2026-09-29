using ShipNex.Application.DTOs;

namespace ShipNex.Application.Interfaces;

public interface IPetShipmentService
{
    Task<PetShipmentResponse> CreateAsync(CreatePetShipmentRequest request, string userId = "");
    Task<PetShipmentResponse?> GetByIdAsync(string id);
    Task<PetShipmentResponse?> GetByTrackingNumberAsync(string trackingNumber);
    /// <summary>Customer-safe public pet tracking view. Never includes private fields.</summary>
    Task<PublicPetTrackingResponse?> GetPublicTrackingAsync(string trackingNumber);
    Task<List<PetShipmentResponse>> GetAllAsync();
    Task<PetShipmentResponse?> UpdateAsync(string id, UpdatePetShipmentRequest request, string userId = "");
    Task<PetShipmentResponse?> AddCareEventAsync(string id, AddPetCareEventRequest request, string userId = "");
    Task<PetShipmentResponse?> UpdateStatusAsync(string id, UpdatePetStatusRequest request, string userId = "");
    Task<PetShipmentResponse?> UpdateLocationAsync(string id, UpdatePetLocationRequest request, string userId = "");
    Task<PetShipmentResponse?> AddDocumentAsync(string id, CreatePetDocumentRequest request, string userId = "");
    Task<PetShipmentResponse?> SetDocumentCustomerVisibleAsync(string petId, string documentId, bool customerVisible, string userId = "");
    Task<bool> DeleteAsync(string id, string userId = "");
}
