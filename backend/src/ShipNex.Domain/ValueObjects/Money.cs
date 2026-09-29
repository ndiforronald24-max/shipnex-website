namespace ShipNex.Domain.ValueObjects;

public class Money
{
    public decimal Amount { get; set; }
    public string Currency { get; set; } = "USD";

    public Money() { }
    public Money(decimal amount, string currency = "USD")
    {
        Amount = amount;
        Currency = currency;
    }

    public override string ToString() => $"{Amount:0.00} {Currency}";
}

public class TrackingInfo
{
    public string CarrierCode { get; set; } = "SHIPNEX";
    public string? ContainerNumber { get; set; }
    public string? FlightNumber { get; set; }
    public string? VesselName { get; set; }
    public string? RouteCode { get; set; }
    public int TotalTransitDays { get; set; }
    public DateTime? LastScannedAt { get; set; }
    public string? LastScanLocation { get; set; }

    public TrackingInfo() { }
}

public class GeoLocation
{
    public double Latitude { get; set; }
    public double Longitude { get; set; }
    public string? Name { get; set; }

    public GeoLocation() { }
    public GeoLocation(double latitude, double longitude, string? name = null)
    {
        Latitude = latitude;
        Longitude = longitude;
        Name = name;
    }

    public double DistanceToKm(GeoLocation other)
    {
        const double earthRadiusKm = 6371.0;
        var dLat = ToRadians(other.Latitude - Latitude);
        var dLon = ToRadians(other.Longitude - Longitude);
        var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                Math.Cos(ToRadians(Latitude)) * Math.Cos(ToRadians(other.Latitude)) *
                Math.Sin(dLon / 2) * Math.Sin(dLon / 2);
        var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
        return earthRadiusKm * c;
    }

    private static double ToRadians(double degrees) => degrees * Math.PI / 180.0;
}