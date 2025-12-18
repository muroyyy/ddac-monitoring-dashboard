using MonitoringDashboard.Api.Models;

namespace MonitoringDashboard.Api.Services;

public class HealthService : IHealthService
{
    private readonly ICloudWatchService _cloudWatchService;
    private readonly ISettingsService _settingsService;
    private readonly ILogger<HealthService> _logger;

    public HealthService(ICloudWatchService cloudWatchService, ISettingsService settingsService, ILogger<HealthService> logger)
    {
        _cloudWatchService = cloudWatchService;
        _settingsService = settingsService;
        _logger = logger;
    }

    public async Task<HealthStatus> GetHealthStatusAsync()
    {
        try
        {
            var settings = await _settingsService.GetSettingsAsync();
            var healthStatus = new HealthStatus();

            // Check EC2 health
            if (!string.IsNullOrEmpty(settings.Ec2.InstanceId))
            {
                var ec2Metrics = await _cloudWatchService.GetEC2MetricsAsync(settings.Ec2.InstanceId);
                healthStatus.Backend = DetermineHealthStatus(
                    ec2Metrics.CpuUtilization, 
                    settings.Thresholds.CpuWarning, 
                    settings.Thresholds.CpuCritical);
            }

            // Check RDS health
            if (!string.IsNullOrEmpty(settings.Rds.DbInstanceIdentifier))
            {
                var rdsMetrics = await _cloudWatchService.GetRDSMetricsAsync(settings.Rds.DbInstanceIdentifier);
                healthStatus.Database = DetermineHealthStatus(
                    rdsMetrics.CpuUtilization, 
                    settings.Thresholds.CpuWarning, 
                    settings.Thresholds.CpuCritical);
            }

            // Check Lambda health (aggregate across all functions)
            if (settings.Serverless.LambdaFunctionNames.Any())
            {
                var lambdaHealthStatuses = new List<string>();
                var totalInvocations = 0;
                var totalErrors = 0;

                foreach (var functionName in settings.Serverless.LambdaFunctionNames)
                {
                    var lambdaMetrics = await _cloudWatchService.GetLambdaMetricsAsync(functionName);
                    totalInvocations += lambdaMetrics.Invocations;
                    totalErrors += lambdaMetrics.Errors;
                }

                var errorRate = totalInvocations > 0 ? (double)totalErrors / totalInvocations * 100 : 0;
                healthStatus.Lambda = DetermineHealthStatus(
                    errorRate, 
                    settings.Thresholds.ErrorRateWarning, 
                    settings.Thresholds.ErrorRateCritical);
            }

            // Check API Gateway health
            if (!string.IsNullOrEmpty(settings.Serverless.ApiGatewayId))
            {
                var apiMetrics = await _cloudWatchService.GetAPIGatewayMetricsAsync(
                    settings.Serverless.ApiGatewayId, 
                    settings.Serverless.ApiGatewayStage);

                healthStatus.Http2xx = apiMetrics.RequestCount - apiMetrics.Count4xx - apiMetrics.Count5xx;
                healthStatus.Http4xx = apiMetrics.Count4xx;
                healthStatus.Http5xx = apiMetrics.Count5xx;

                // CDN health based on error rates
                var totalRequests = apiMetrics.RequestCount;
                var errorRate = totalRequests > 0 ? (double)(apiMetrics.Count4xx + apiMetrics.Count5xx) / totalRequests * 100 : 0;
                healthStatus.Cdn = DetermineHealthStatus(
                    errorRate, 
                    settings.Thresholds.ErrorRateWarning, 
                    settings.Thresholds.ErrorRateCritical);
            }

            return healthStatus;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error determining health status");
            return new HealthStatus
            {
                Backend = "error",
                Database = "error",
                Lambda = "error",
                Cdn = "error"
            };
        }
    }

    public async Task<DeploymentInfo> GetDeploymentInfoAsync()
    {
        try
        {
            // In a real implementation, this could come from:
            // - EC2 instance tags
            // - SSM parameters
            // - CodeDeploy API
            // - Environment variables set during deployment
            
            return new DeploymentInfo
            {
                LastDeployment = DateTime.UtcNow.AddHours(-2).ToString("O"),
                BuildId = $"build-{Environment.GetEnvironmentVariable("BUILD_ID") ?? "local"}",
                Branch = Environment.GetEnvironmentVariable("GIT_BRANCH") ?? "main",
                Status = "success"
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving deployment info");
            return new DeploymentInfo
            {
                LastDeployment = DateTime.UtcNow.ToString("O"),
                BuildId = "unknown",
                Branch = "unknown",
                Status = "unknown"
            };
        }
    }

    private static string DetermineHealthStatus(double value, double warningThreshold, double criticalThreshold)
    {
        if (value >= criticalThreshold)
            return "error";
        if (value >= warningThreshold)
            return "warning";
        return "healthy";
    }
}