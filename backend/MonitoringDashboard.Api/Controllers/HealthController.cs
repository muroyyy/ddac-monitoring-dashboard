using Microsoft.AspNetCore.Mvc;
using MonitoringDashboard.Api.Models;
using MonitoringDashboard.Api.Services;

namespace MonitoringDashboard.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class HealthController : ControllerBase
{
    private readonly IHealthService _healthService;
    private readonly ILogger<HealthController> _logger;

    public HealthController(IHealthService healthService, ILogger<HealthController> logger)
    {
        _healthService = healthService;
        _logger = logger;
    }

    [HttpGet("status")]
    public async Task<ActionResult<HealthStatus>> GetHealthStatus()
    {
        try
        {
            var healthStatus = await _healthService.GetHealthStatusAsync();
            return Ok(healthStatus);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving health status");
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpGet("deployment")]
    public async Task<ActionResult<DeploymentInfo>> GetDeploymentInfo()
    {
        try
        {
            var deploymentInfo = await _healthService.GetDeploymentInfoAsync();
            return Ok(deploymentInfo);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving deployment info");
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpGet]
    public async Task<ActionResult<object>> GetOverallHealth()
    {
        try
        {
            var healthStatusTask = _healthService.GetHealthStatusAsync();
            var deploymentInfoTask = _healthService.GetDeploymentInfoAsync();

            await Task.WhenAll(healthStatusTask, deploymentInfoTask);

            return Ok(new
            {
                healthStatus = await healthStatusTask,
                deploymentInfo = await deploymentInfoTask,
                timestamp = DateTime.UtcNow.ToString("O")
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving overall health");
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpGet("ping")]
    public ActionResult Ping()
    {
        return Ok(new { status = "healthy", timestamp = DateTime.UtcNow.ToString("O") });
    }
}