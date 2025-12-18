using MonitoringDashboard.Api.Models;

namespace MonitoringDashboard.Api.Services;

public interface IAuthService
{
    Task<LoginResponse?> LoginAsync(string username, string password);
    Task<bool> VerifyEmailAsync(string email);
    Task<bool> ResetPasswordAsync(string email, string newPassword);
    Task<bool> ValidateSessionAsync(string sessionToken);
}
