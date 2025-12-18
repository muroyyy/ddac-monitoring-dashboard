using MonitoringDashboard.Api.Models;

namespace MonitoringDashboard.Api.Services;

public interface ISettingsService
{
    Task<MonitoringSettings> GetSettingsAsync();
    Task<bool> SaveSettingsAsync(MonitoringSettings settings);
}