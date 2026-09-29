using System.ComponentModel.DataAnnotations;

namespace ShipNex.Application.DTOs;

public record LoginRequest(
    [param: Required, EmailAddress] string Email,
    [param: Required, StringLength(100, MinimumLength = 6)] string Password
);

public record RegisterRequest(
    [param: Required, StringLength(50)] string FirstName,
    [param: Required, StringLength(50)] string LastName,
    [param: Required, EmailAddress] string Email,
    [param: Required, StringLength(100, MinimumLength = 6)] string Password,
    [param: StringLength(20)] string? Phone,
    [param: StringLength(200)] string? Address
);

public record AuthResponse(string Token, string Id, string Email, string FirstName, string Role);
