using Microsoft.AspNetCore.Mvc;
using MonitoringDashboard.Api.Models;
using MonitoringDashboard.Api.Services;

namespace MonitoringDashboard.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly ILogger<AuthController> _logger;

    public AuthController(IAuthService authService, ILogger<AuthController> logger)
    {
        _authService = authService;
        _logger = logger;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        if (string.IsNullOrEmpty(request.Username) || string.IsNullOrEmpty(request.Password))
        {
            return BadRequest(new { message = "Username and password are required" });
        }

        var response = await _authService.LoginAsync(request.Username, request.Password);
        if (response == null)
        {
            return Unauthorized(new { message = "Invalid username or password" });
        }

        return Ok(response);
    }

    [HttpPost("verify-email")]
    public async Task<IActionResult> VerifyEmail([FromBody] VerifyEmailRequest request)
    {
        if (string.IsNullOrEmpty(request.Email))
        {
            return BadRequest(new { message = "Email is required" });
        }

        var isValid = await _authService.VerifyEmailAsync(request.Email);
        if (!isValid)
        {
            return NotFound(new { message = "Email does not match our records" });
        }

        return Ok(new { message = "Email verified successfully" });
    }

    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request)
    {
        if (string.IsNullOrEmpty(request.Email) || string.IsNullOrEmpty(request.NewPassword))
        {
            return BadRequest(new { message = "Email and new password are required" });
        }

        if (request.NewPassword.Length < 6)
        {
            return BadRequest(new { message = "Password must be at least 6 characters" });
        }

        var success = await _authService.ResetPasswordAsync(request.Email, request.NewPassword);
        if (!success)
        {
            return BadRequest(new { message = "Password reset failed" });
        }

        return Ok(new { message = "Password reset successfully" });
    }

    [HttpPost("validate-session")]
    public async Task<IActionResult> ValidateSession([FromBody] string sessionToken)
    {
        var isValid = await _authService.ValidateSessionAsync(sessionToken);
        return Ok(new { isValid });
    }
}
