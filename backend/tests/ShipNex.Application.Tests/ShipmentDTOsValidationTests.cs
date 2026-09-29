using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Reflection;
using ShipNex.Application.DTOs;
using Xunit;

namespace ShipNex.Application.Tests;

/// <summary>
/// Validates the data annotation rules on the shipment request DTOs.
/// These are the same rules ASP.NET Core model binding enforces on the API.
/// </summary>
public class ShipmentDTOsValidationTests
{
    /// <summary>
    /// Records carry their data annotations on the primary-constructor parameters,
    /// which DataAnnotations.Validator does not surface — but ASP.NET Core MVC does.
    /// This helper reads the attributes exactly as MVC would and runs them against a value.
    /// </summary>
    private static List<string> ValidateProperty<T>(string parameterName, T value)
    {
        var errors = new List<string>();
        var ctor = typeof(CreateShipmentRequest).GetConstructors()
            .First(c => c.GetParameters().Any(p => p.Name == parameterName));
        var parameter = ctor.GetParameters().First(p => p.Name == parameterName);

        foreach (var attr in parameter.GetCustomAttributes<ValidationAttribute>())
        {
            var result = attr.GetValidationResult(value, new ValidationContext(new object()) { DisplayName = parameterName });
            if (result != null)
                errors.Add(result.ErrorMessage ?? attr.GetType().Name);
        }
        return errors;
    }

    private static CreateShipmentRequest ValidRequest() => new(
        SenderName: "John Doe",
        SenderAddress: "123 Main St, New York, NY",
        ReceiverName: "Jane Smith",
        ReceiverAddress: "456 High St, London, UK",
        Origin: "New York",
        Destination: "London",
        Weight: 12.5,
        NumberOfPieces: 2,
        ServiceType: "Express",
        ShipmentType: "Standard",
        ReferenceNumber: "REF-001",
        EstimatedDelivery: null,
        Notes: null);

    private static List<string> ValidateProperty<T>(Type dtoType, string parameterName, T value)
    {
        var errors = new List<string>();
        var ctor = dtoType.GetConstructors()
            .First(c => c.GetParameters().Any(p => p.Name == parameterName));
        var parameter = ctor.GetParameters().First(p => p.Name == parameterName);

        foreach (var attr in parameter.GetCustomAttributes<ValidationAttribute>())
        {
            var result = attr.GetValidationResult(value, new ValidationContext(new object()) { DisplayName = parameterName });
            if (result != null)
                errors.Add(result.ErrorMessage ?? attr.GetType().Name);
        }
        return errors;
    }

    [Fact]
    public void CreateShipmentRequest_ValidValues_PassAllValidation()
    {
        Assert.Empty(ValidateProperty(typeof(CreateShipmentRequest), "SenderName", "John Doe"));
        Assert.Empty(ValidateProperty(typeof(CreateShipmentRequest), "SenderAddress", "123 Main St, New York, NY"));
        Assert.Empty(ValidateProperty(typeof(CreateShipmentRequest), "Origin", "New York"));
        Assert.Empty(ValidateProperty(typeof(CreateShipmentRequest), "Destination", "London"));
        Assert.Empty(ValidateProperty(typeof(CreateShipmentRequest), "Weight", 12.5));
        Assert.Empty(ValidateProperty(typeof(CreateShipmentRequest), "NumberOfPieces", 2));
    }

    [Fact]
    public void CreateShipmentRequest_MissingSenderName_FailsRequired()
    {
        Assert.NotEmpty(ValidateProperty(typeof(CreateShipmentRequest), "SenderName", ""));
        Assert.NotEmpty(ValidateProperty<string>(typeof(CreateShipmentRequest), "SenderName", null!));
    }

    [Fact]
    public void CreateShipmentRequest_ZeroOrNegativeWeight_FailsRange()
    {
        Assert.NotEmpty(ValidateProperty(typeof(CreateShipmentRequest), "Weight", 0.0));
        Assert.NotEmpty(ValidateProperty(typeof(CreateShipmentRequest), "Weight", -5.0));
        Assert.Empty(ValidateProperty(typeof(CreateShipmentRequest), "Weight", 0.01));
    }

    [Fact]
    public void CreateShipmentRequest_ZeroPieces_FailsRange()
    {
        Assert.NotEmpty(ValidateProperty(typeof(CreateShipmentRequest), "NumberOfPieces", 0));
        Assert.Empty(ValidateProperty(typeof(CreateShipmentRequest), "NumberOfPieces", 1));
    }

    [Fact]
    public void CreateShipmentRequest_MissingOriginOrDestination_FailsRequired()
    {
        Assert.NotEmpty(ValidateProperty(typeof(CreateShipmentRequest), "Origin", ""));
        Assert.NotEmpty(ValidateProperty(typeof(CreateShipmentRequest), "Destination", ""));
    }

    [Fact]
    public void CreateShipmentRequest_SenderNameOver100Chars_FailsStringLength()
    {
        Assert.NotEmpty(ValidateProperty(typeof(CreateShipmentRequest), "SenderName", new string('x', 101)));
        Assert.Empty(ValidateProperty(typeof(CreateShipmentRequest), "SenderName", new string('x', 100)));
    }

    [Fact]
    public void UpdateShipmentStatusRequest_MissingStatus_FailsRequired()
    {
        Assert.NotEmpty(ValidateProperty(typeof(UpdateShipmentStatusRequest), "Status", ""));
        Assert.Empty(ValidateProperty(typeof(UpdateShipmentStatusRequest), "Status", "InTransit"));
    }

    [Fact]
    public void AddTrackingEventRequest_MissingLocationName_FailsRequired()
    {
        Assert.NotEmpty(ValidateProperty(typeof(AddTrackingEventRequest), "LocationName", ""));
        Assert.Empty(ValidateProperty(typeof(AddTrackingEventRequest), "LocationName", "Warehouse A"));
    }

    [Fact]
    public void ShipmentFilterRequest_HasSanePagingDefaults()
    {
        var filter = new ShipmentFilterRequest(null, null, null, null, null, null, null);
        Assert.Equal(1, filter.Page);
        Assert.Equal(20, filter.PageSize);
    }
}
