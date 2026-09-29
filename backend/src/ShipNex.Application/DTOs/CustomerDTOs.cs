using System.ComponentModel.DataAnnotations;

namespace ShipNex.Application.DTOs;

public record CreateCustomerRequest(
    [param: Required, StringLength(50)] string FirstName,
    [param: Required, StringLength(50)] string LastName,
    [param: Required, EmailAddress] string Email,
    [param: StringLength(20)] string? Phone,
    [param: StringLength(200)] string? Address
);

public record UpdateCustomerRequest(
    [param: Required, StringLength(50)] string FirstName,
    [param: Required, StringLength(50)] string LastName,
    [param: StringLength(20)] string? Phone,
    [param: StringLength(200)] string? Address
);

public record CustomerResponse(
    string Id,
    string FirstName,
    string LastName,
    string Email,
    string Phone,
    string Address,
    string Role,
    DateTime CreatedAt
);
