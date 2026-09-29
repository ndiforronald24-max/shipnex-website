using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ShipNex.Api.Controllers;

/// <summary>
/// Receives public contact-form submissions. Logged server-side; email delivery
/// can be attached to the existing SMTP infrastructure once production
/// credentials are configured. No private data is returned.
/// </summary>
[ApiController]
[Route("api/contact")]
public class ContactController : ControllerBase
{
    private readonly ILogger<ContactController> _logger;

    public ContactController(ILogger<ContactController> logger)
    {
        _logger = logger;
    }

    public record ContactRequest(string Name, string Email, string Subject, string Message);

    [HttpPost]
    [AllowAnonymous]
    public IActionResult Submit([FromBody] ContactRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name) ||
            string.IsNullOrWhiteSpace(request.Email) ||
            string.IsNullOrWhiteSpace(request.Subject) ||
            string.IsNullOrWhiteSpace(request.Message))
        {
            return BadRequest(new { message = "All fields are required." });
        }

        _logger.LogInformation(
            "Contact form submission from {Name} <{Email}>: {Subject}",
            request.Name, request.Email, request.Subject);

        return Ok(new { message = "Message received." });
    }
}
