using Microsoft.AspNetCore.Mvc;
using MonitoringDashboard.Api.Models;
using MonitoringDashboard.Api.Services;

namespace MonitoringDashboard.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SettingsController : ControllerBase
{
    private readonly ISettingsService _settingsService;
    private readonly ILogger<SettingsController> _logger;

    public SettingsController(ISettingsService settingsService, ILogger<SettingsController> logger)
    {
        _settingsService = settingsService;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<MonitoringSettings>> GetSettings()
    {
        try
        {
            var settings = await _settingsService.GetSettingsAsync();
            return Ok(settings);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving settings");
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpPost]
    public async Task<ActionResult> SaveSettings([FromBody] MonitoringSettings settings)
    {
        try
        {
            if (settings == null)
            {
                return BadRequest("Settings cannot be null");
            }

            var success = await _settingsService.SaveSettingsAsync(settings);
            
            if (success)
            {
                return Ok(new { message = "Settings saved successfully" });
            }
            else
            {
                return StatusCode(500, "Failed to save settings");
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error saving settings");
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpGet("validate")]
    public async Task<ActionResult<object>> ValidateSettings()
    {
        try
        {
            var settings = await _settingsService.GetSettingsAsync();
            var validation = new
            {
                isValid = true,
                issues = new List<string>(),
                ec2Configured = !string.IsNullOrEmpty(settings.Ec2.InstanceId),
                rdsConfigured = !string.IsNullOrEmpty(settings.Rds.DbInstanceIdentifier),
                lambdaConfigured = settings.Serverless.LambdaFunctionNames.Any(),
                apiGatewayConfigured = !string.IsNullOrEmpty(settings.Serverless.ApiGatewayId)
            };

            return Ok(validation);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error validating settings");
            return StatusCode(500, "Internal server error");
        }
    }
}