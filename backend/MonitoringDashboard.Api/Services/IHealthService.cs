using MonitoringDashboard.Api.Models;

namespace MonitoringDashboard.Api.Services;

public interface IHealthService
{
    Task<HealthStatus> GetHealthStatusAsync();
    Task<DeploymentInfo> GetDeploymentInfoAsync();
}