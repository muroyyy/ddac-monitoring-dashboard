using Microsoft.AspNetCore.Mvc;
using Amazon.CloudWatch;
using Amazon.CloudWatch.Model;
using Amazon.Runtime;
using MonitoringDashboard.Api.Services;

namespace MonitoringDashboard.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MetricsController : ControllerBase
{
    private readonly ILogger<MetricsController> _logger;
    private readonly ILoggerFactory _loggerFactory;
    private readonly MonitoredResourceService _resourceService;
    private readonly AWSAccountService _accountService;

    public MetricsController(
        ILogger<MetricsController> logger, 
        ILoggerFactory loggerFactory,
        MonitoredResourceService resourceService,
        AWSAccountService accountService)
    {
        _logger = logger;
        _loggerFactory = loggerFactory;
        _resourceService = resourceService;
        _accountService = accountService;
    }

    [HttpPost]
    public async Task<IActionResult> GetMetrics([FromBody] MetricsRequest request)
    {
        try
        {
            var credentials = new BasicAWSCredentials(request.AccessKeyId, request.SecretAccessKey);
            var region = Amazon.RegionEndpoint.GetBySystemName(request.Region);

            // Get monitored resources for this account
            var sessionToken = Request.Headers["Authorization"].ToString().Replace("Bearer ", "");
            var userId = await _accountService.GetUserIdFromSessionAsync(sessionToken);
            
            string? ec2Name = null, rdsName = null, lambdaName = null;
            
            if (userId != null && !string.IsNullOrEmpty(request.AccountId))
            {
                var resources = await _resourceService.GetMonitoredResourcesAsync(request.AccountId);
                var resourceList = System.Text.Json.JsonSerializer.Deserialize<List<ResourceInfo>>(System.Text.Json.JsonSerializer.Serialize(resources));
                
                ec2Name = resourceList?.FirstOrDefault(r => r.Type == "ec2")?.Name;
                rdsName = resourceList?.FirstOrDefault(r => r.Type == "rds")?.Name;
                lambdaName = resourceList?.FirstOrDefault(r => r.Type == "lambda")?.Name;
            }

            // Create CloudWatch service with provided credentials
            var cloudWatchService = new CloudWatchService(credentials, region, _loggerFactory.CreateLogger<CloudWatchService>());

            // Fetch metrics from monitored resources
            var ec2Metrics = await cloudWatchService.GetEC2MetricsAsync(request.Ec2InstanceId ?? "");
            var rdsMetrics = await cloudWatchService.GetRDSMetricsAsync(request.RdsInstanceId ?? "");
            var lambdaMetrics = await cloudWatchService.GetLambdaMetricsAsync(request.LambdaFunctionName ?? "");
            var apiGatewayMetrics = await cloudWatchService.GetAPIGatewayMetricsAsync(
                request.ApiGatewayId ?? "", 
                request.ApiGatewayStage ?? "prod"
            );

            var response = new
            {
                ec2Metrics = ec2Metrics != null ? new { resourceName = ec2Name, ec2Metrics.cpuUtilization, ec2Metrics.memoryUtilization, ec2Metrics.diskUsage, ec2Metrics.networkIn, ec2Metrics.networkOut, ec2Metrics.cpuHistory, ec2Metrics.memoryHistory } : null,
                rdsMetrics = rdsMetrics != null ? new { resourceName = rdsName, rdsMetrics.cpuUtilization, rdsMetrics.freeableMemory, rdsMetrics.databaseConnections, rdsMetrics.readIOPS, rdsMetrics.writeIOPS, rdsMetrics.cpuHistory, rdsMetrics.connectionsHistory } : null,
                lambdaMetrics = lambdaMetrics != null ? new { resourceName = lambdaName, lambdaMetrics.invocations, lambdaMetrics.errors, lambdaMetrics.duration, lambdaMetrics.throttles, lambdaMetrics.invocationsHistory, lambdaMetrics.errorsHistory } : null,
                apiGatewayMetrics,
                healthStatus = new
                {
                    backend = "healthy",
                    database = "healthy",
                    lambda = "healthy",
                    cdn = "healthy",
                    http2xx = 4850,
                    http4xx = 45,
                    http5xx = 2
                },
                deploymentInfo = new
                {
                    lastDeployment = DateTime.UtcNow.AddHours(-2).ToString("O"),
                    buildId = "build-latest",
                    branch = "main",
                    status = "success"
                }
            };

            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching metrics");
            return BadRequest(new { message = "Failed to fetch metrics", error = ex.Message });
        }
    }
}

public class ResourceInfo
{
    public string Type { get; set; } = string.Empty;
    public string ResourceId { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public bool IsEnabled { get; set; }
}

public class MetricsRequest
{
    public string AccessKeyId { get; set; } = string.Empty;
    public string SecretAccessKey { get; set; } = string.Empty;
    public string Region { get; set; } = string.Empty;
    public string? AccountId { get; set; }
    public string? Ec2InstanceId { get; set; }
    public string? RdsInstanceId { get; set; }
    public string? LambdaFunctionName { get; set; }
    public string? ApiGatewayId { get; set; }
    public string? ApiGatewayStage { get; set; }
}
