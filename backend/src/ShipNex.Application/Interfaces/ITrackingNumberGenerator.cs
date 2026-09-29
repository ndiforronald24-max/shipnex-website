namespace ShipNex.Application.Interfaces;

public interface ITrackingNumberGenerator
{
    /// <summary>Generates a unique standard tracking number: USP-YYYY-XXXXXX</summary>
    Task<string> GenerateShipmentTrackingNumberAsync();

    /// <summary>Generates a unique pet tracking number: USP-PET-YYYY-XXXXXX</summary>
    Task<string> GeneratePetTrackingNumberAsync();
}