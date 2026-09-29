using ShipNex.Domain.ValueObjects;
using Xunit;

namespace ShipNex.Application.Tests;

/// <summary>
/// Sanity tests for the domain value objects surfaced through Application DTOs.
/// </summary>
public class ValueObjectTests
{
    [Fact]
    public void Money_ToString_FormatsAmountAndCurrency()
    {
        var money = new Money(199.99m, "USD");
        Assert.Equal("199.99 USD", money.ToString());
    }

    [Fact]
    public void Money_DefaultCurrency_IsUsd()
    {
        var money = new Money(50m);
        Assert.Equal("USD", money.Currency);
        Assert.Equal(50m, money.Amount);
    }

    [Fact]
    public void GeoLocation_DistanceToSamePoint_IsZero()
    {
        var a = new GeoLocation(40.7128, -74.0060, "New York");
        var b = new GeoLocation(40.7128, -74.0060, "New York");
        Assert.Equal(0, a.DistanceToKm(b), precision: 5);
    }

    [Fact]
    public void GeoLocation_DistanceLondonToParis_IsPlausible()
    {
        var london = new GeoLocation(51.5074, -0.1278);
        var paris = new GeoLocation(48.8566, 2.3522);
        var km = london.DistanceToKm(paris);
        // Great-circle distance London-Paris is roughly 344 km.
        Assert.InRange(km, 330, 360);
    }

    [Fact]
    public void TrackingInfo_DefaultsCarrierToShipnex()
    {
        var info = new TrackingInfo();
        Assert.Equal("SHIPNEX", info.CarrierCode);
    }
}
