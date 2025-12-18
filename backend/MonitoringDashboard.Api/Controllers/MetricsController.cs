using Microsoft.AspNetCore.Mvc;
using MonitoringDashboard.Api.Models;
using MonitoringDashboard.Api.Services;

namespace MonitoringDashboard.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MetricsController : ControllerBase
{
    private readonly ICloudWatchService _cloudWatchService;
    private readonly ISettingsService _settingsService;
    private readonly ILogger<MetricsController> _logger;

    public MetricsController(
        ICloudWatchService cloudWatchService, 
        ISettingsService settingsService,
        ILogger<MetricsController> logger)
    {
        _cloudWatchService = cloudWatchService;
        _settingsService = settingsService;
        _logger = logger;
    }

    [HttpGet("ec2")]
    public async Task<ActionResult<EC2Metrics>> GetEC2Metrics()
    {
        try
        {
            var settings = await _settingsService.GetSettingsAsync();
            
            if (string.IsNullOrEmpty(settings.Ec2.InstanceId))
            {
                return BadRequest("EC2 Instance ID not configured");
            }

            var metrics = await _cloudWatchService.GetEC2MetricsAsync(settings.Ec2.InstanceId);
            return Ok(metrics);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving EC2 metrics");
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpGet("rds")]
    public async Task<ActionResult<RDSMetrics>> GetRDSMetrics()
    {
        try
        {
            var settings = await _settingsService.GetSettingsAsync();
            
            if (string.IsNullOrEmpty(settings.Rds.DbInstanceIdentifier))
            {
                return BadRequest("RDS Instance Identifier not configured");
            }

            var metrics = await _cloudWatchService.GetRDSMetricsAsync(settings.Rds.DbInstanceIdentifier);
            return Ok(metrics);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving RDS metrics");
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpGet("lambda")]
    public async Task<ActionResult<LambdaMetrics>> GetLambdaMetrics([FromQuery] string? functionName = null)
    {
        try
        {
            var settings = await _settingsService.GetSettingsAsync();
            
            // Use provided function name or first configured function
            var targetFunction = functionName ?? settings.Serverless.LambdaFunctionNames.FirstOrDefault();
            
            if (string.IsNullOrEmpty(targetFunction))
            {
                return BadRequest("Lambda function name not provided or configured");
            }

            var metrics = await _cloudWatchService.GetLambdaMetricsAsync(targetFunction);
            return Ok(metrics);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving Lambda metrics");
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpGet("apigateway")]
    public async Task<ActionResult<APIGatewayMetrics>> GetAPIGatewayMetrics()
    {
        try
        {
            var settings = await _settingsService.GetSettingsAsync();
            
            if (string.IsNullOrEmpty(settings.Serverless.ApiGatewayId))
            {
                return BadRequest("API Gateway ID not configured");
            }

            var metrics = await _cloudWatchService.GetAPIGatewayMetricsAsync(
                settings.Serverless.ApiGatewayId, 
                settings.Serverless.ApiGatewayStage);
            return Ok(metrics);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving API Gateway metrics");
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpGet("all")]
    public async Task<ActionResult<object>> GetAllMetrics()
    {
        try
        {
            var settings = await _settingsService.GetSettingsAsync();

            // Get all metrics in parallel
            var tasks = new List<Task>();
            EC2Metrics? ec2Metrics = null;
            RDSMetrics? rdsMetrics = null;
            LambdaMetrics? lambdaMetrics = null;
            APIGatewayMetrics? apiGatewayMetrics = null;

            if (!string.IsNullOrEmpty(settings.Ec2.InstanceId))
            {
                tasks.Add(Task.Run(async () => ec2Metrics = await _cloudWatchService.GetEC2MetricsAsync(settings.Ec2.InstanceId)));
            }

            if (!string.IsNullOrEmpty(settings.Rds.DbInstanceIdentifier))
            {
                tasks.Add(Task.Run(async () => rdsMetrics = await _cloudWatchService.GetRDSMetricsAsync(settings.Rds.DbInstanceIdentifier)));
            }

            if (settings.Serverless.LambdaFunctionNames.Any())
            {
                tasks.Add(Task.Run(async () => lambdaMetrics = await _cloudWatchService.GetLambdaMetricsAsync(settings.Serverless.LambdaFunctionNames.First())));
            }

            if (!string.IsNullOrEmpty(settings.Serverless.ApiGatewayId))
            {
                tasks.Add(Task.Run(async () => apiGatewayMetrics = await _cloudWatchService.GetAPIGatewayMetricsAsync(settings.Serverless.ApiGatewayId, settings.Serverless.ApiGatewayStage)));
            }

            await Task.WhenAll(tasks);

            return Ok(new
            {
                ec2Metrics = ec2Metrics ?? new EC2Metrics(),
                rdsMetrics = rdsMetrics ?? new RDSMetrics(),
                lambdaMetrics = lambdaMetrics ?? new LambdaMetrics(),
                apiGatewayMetrics = apiGatewayMetrics ?? new APIGatewayMetrics(),
                lastUpdated = DateTime.UtcNow.ToString("O")
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving all metrics");
            return StatusCode(500, "Internal server error");
        }
    }
}