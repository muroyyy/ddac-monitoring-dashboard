using Amazon.CloudWatch;
using Amazon.CloudWatch.Model;
using Amazon.Runtime;
using MonitoringDashboard.Api.Models;

namespace MonitoringDashboard.Api.Services;

public class CloudWatchService : ICloudWatchService
{
    private readonly IAmazonCloudWatch _cloudWatch;
    private readonly ILogger<CloudWatchService> _logger;

    // Constructor for DI with IAM role
    public CloudWatchService(IAmazonCloudWatch cloudWatch, ILogger<CloudWatchService> logger)
    {
        _cloudWatch = cloudWatch;
        _logger = logger;
    }

    // Constructor for dynamic credentials
    public CloudWatchService(BasicAWSCredentials credentials, Amazon.RegionEndpoint region, ILogger<CloudWatchService> logger)
    {
        _cloudWatch = new AmazonCloudWatchClient(credentials, region);
        _logger = logger;
    }

    public async Task<EC2Metrics> GetEC2MetricsAsync(string instanceId)
    {
        try
        {
            var endTime = DateTime.UtcNow;
            var startTime = endTime.AddMinutes(-30);

            // Get current metrics (latest values)
            var cpuTask = GetLatestMetricValueAsync("AWS/EC2", "CPUUtilization", "InstanceId", instanceId);
            var networkInTask = GetLatestMetricValueAsync("AWS/EC2", "NetworkIn", "InstanceId", instanceId);
            var networkOutTask = GetLatestMetricValueAsync("AWS/EC2", "NetworkOut", "InstanceId", instanceId);
            
            // CloudWatch Agent metrics (requires CWAgent namespace)
            var memoryTask = GetLatestMetricValueAsync("CWAgent", "mem_used_percent", "InstanceId", instanceId);
            var diskTask = GetLatestMetricValueAsync("CWAgent", "disk_used_percent", "InstanceId", instanceId);

            // Get historical data
            var cpuHistoryTask = GetMetricHistoryAsync("AWS/EC2", "CPUUtilization", "InstanceId", instanceId, startTime, endTime);
            var memoryHistoryTask = GetMetricHistoryAsync("CWAgent", "mem_used_percent", "InstanceId", instanceId, startTime, endTime);

            await Task.WhenAll(cpuTask, networkInTask, networkOutTask, memoryTask, diskTask, cpuHistoryTask, memoryHistoryTask);

            return new EC2Metrics
            {
                CpuUtilization = await cpuTask,
                MemoryUtilization = await memoryTask,
                DiskUsage = await diskTask,
                NetworkIn = await networkInTask / 1024 / 1024, // Convert to MB
                NetworkOut = await networkOutTask / 1024 / 1024, // Convert to MB
                CpuHistory = await cpuHistoryTask,
                MemoryHistory = await memoryHistoryTask
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving EC2 metrics for instance {InstanceId}", instanceId);
            return new EC2Metrics();
        }
    }

    public async Task<RDSMetrics> GetRDSMetricsAsync(string dbInstanceIdentifier)
    {
        try
        {
            var endTime = DateTime.UtcNow;
            var startTime = endTime.AddMinutes(-30);

            var cpuTask = GetLatestMetricValueAsync("AWS/RDS", "CPUUtilization", "DBInstanceIdentifier", dbInstanceIdentifier);
            var memoryTask = GetLatestMetricValueAsync("AWS/RDS", "FreeableMemory", "DBInstanceIdentifier", dbInstanceIdentifier);
            var connectionsTask = GetLatestMetricValueAsync("AWS/RDS", "DatabaseConnections", "DBInstanceIdentifier", dbInstanceIdentifier);
            var readIOPSTask = GetLatestMetricValueAsync("AWS/RDS", "ReadIOPS", "DBInstanceIdentifier", dbInstanceIdentifier);
            var writeIOPSTask = GetLatestMetricValueAsync("AWS/RDS", "WriteIOPS", "DBInstanceIdentifier", dbInstanceIdentifier);

            var cpuHistoryTask = GetMetricHistoryAsync("AWS/RDS", "CPUUtilization", "DBInstanceIdentifier", dbInstanceIdentifier, startTime, endTime);
            var connectionsHistoryTask = GetMetricHistoryAsync("AWS/RDS", "DatabaseConnections", "DBInstanceIdentifier", dbInstanceIdentifier, startTime, endTime);

            await Task.WhenAll(cpuTask, memoryTask, connectionsTask, readIOPSTask, writeIOPSTask, cpuHistoryTask, connectionsHistoryTask);

            return new RDSMetrics
            {
                CpuUtilization = await cpuTask,
                FreeableMemory = (await memoryTask) / 1024 / 1024 / 1024, // Convert to GB
                DatabaseConnections = (int)await connectionsTask,
                ReadIOPS = await readIOPSTask,
                WriteIOPS = await writeIOPSTask,
                CpuHistory = await cpuHistoryTask,
                ConnectionsHistory = await connectionsHistoryTask
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving RDS metrics for instance {DbInstanceIdentifier}", dbInstanceIdentifier);
            return new RDSMetrics();
        }
    }

    public async Task<LambdaMetrics> GetLambdaMetricsAsync(string functionName)
    {
        try
        {
            var endTime = DateTime.UtcNow;
            var startTime = endTime.AddMinutes(-30);

            var invocationsTask = GetLatestMetricValueAsync("AWS/Lambda", "Invocations", "FunctionName", functionName);
            var errorsTask = GetLatestMetricValueAsync("AWS/Lambda", "Errors", "FunctionName", functionName);
            var durationTask = GetLatestMetricValueAsync("AWS/Lambda", "Duration", "FunctionName", functionName);
            var throttlesTask = GetLatestMetricValueAsync("AWS/Lambda", "Throttles", "FunctionName", functionName);

            var invocationsHistoryTask = GetMetricHistoryAsync("AWS/Lambda", "Invocations", "FunctionName", functionName, startTime, endTime);
            var errorsHistoryTask = GetMetricHistoryAsync("AWS/Lambda", "Errors", "FunctionName", functionName, startTime, endTime);

            await Task.WhenAll(invocationsTask, errorsTask, durationTask, throttlesTask, invocationsHistoryTask, errorsHistoryTask);

            return new LambdaMetrics
            {
                Invocations = (int)await invocationsTask,
                Errors = (int)await errorsTask,
                Duration = await durationTask,
                Throttles = (int)await throttlesTask,
                InvocationsHistory = await invocationsHistoryTask,
                ErrorsHistory = await errorsHistoryTask
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving Lambda metrics for function {FunctionName}", functionName);
            return new LambdaMetrics();
        }
    }

    public async Task<APIGatewayMetrics> GetAPIGatewayMetricsAsync(string apiId, string stage)
    {
        try
        {
            var endTime = DateTime.UtcNow;
            var startTime = endTime.AddMinutes(-30);

            var dimensions = new List<Dimension>
            {
                new() { Name = "ApiId", Value = apiId },
                new() { Name = "Stage", Value = stage }
            };

            var countTask = GetLatestMetricValueAsync("AWS/ApiGateway", "Count", dimensions);
            var latencyTask = GetLatestMetricValueAsync("AWS/ApiGateway", "Latency", dimensions);
            var error4xxTask = GetLatestMetricValueAsync("AWS/ApiGateway", "4XXError", dimensions);
            var error5xxTask = GetLatestMetricValueAsync("AWS/ApiGateway", "5XXError", dimensions);

            var requestHistoryTask = GetMetricHistoryAsync("AWS/ApiGateway", "Count", dimensions, startTime, endTime);

            await Task.WhenAll(countTask, latencyTask, error4xxTask, error5xxTask, requestHistoryTask);

            return new APIGatewayMetrics
            {
                RequestCount = (int)await countTask,
                Latency = await latencyTask,
                Count4xx = (int)await error4xxTask,
                Count5xx = (int)await error5xxTask,
                RequestHistory = await requestHistoryTask
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving API Gateway metrics for API {ApiId}", apiId);
            return new APIGatewayMetrics();
        }
    }

    private async Task<double> GetLatestMetricValueAsync(string nameSpace, string metricName, string dimensionName, string dimensionValue)
    {
        var dimensions = new List<Dimension> { new() { Name = dimensionName, Value = dimensionValue } };
        return await GetLatestMetricValueAsync(nameSpace, metricName, dimensions);
    }

    private async Task<double> GetLatestMetricValueAsync(string nameSpace, string metricName, List<Dimension> dimensions)
    {
        try
        {
            var request = new GetMetricStatisticsRequest
            {
                Namespace = nameSpace,
                MetricName = metricName,
                Dimensions = dimensions,
                StartTimeUtc = DateTime.UtcNow.AddMinutes(-10),
                EndTimeUtc = DateTime.UtcNow,
                Period = 300, // 5 minutes
                Statistics = new List<string> { "Average" }
            };

            var response = await _cloudWatch.GetMetricStatisticsAsync(request);
            var lastDatapoint = response.Datapoints.LastOrDefault();
            return lastDatapoint?.Average ?? 0.0;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to get metric {MetricName} from {Namespace}", metricName, nameSpace);
            return 0.0;
        }
    }

    private async Task<List<MetricDataPoint>> GetMetricHistoryAsync(string nameSpace, string metricName, string dimensionName, string dimensionValue, DateTime startTime, DateTime endTime)
    {
        var dimensions = new List<Dimension> { new() { Name = dimensionName, Value = dimensionValue } };
        return await GetMetricHistoryAsync(nameSpace, metricName, dimensions, startTime, endTime);
    }

    private async Task<List<MetricDataPoint>> GetMetricHistoryAsync(string nameSpace, string metricName, List<Dimension> dimensions, DateTime startTime, DateTime endTime)
    {
        try
        {
            var request = new GetMetricStatisticsRequest
            {
                Namespace = nameSpace,
                MetricName = metricName,
                Dimensions = dimensions,
                StartTimeUtc = startTime,
                EndTimeUtc = endTime,
                Period = 300, // 5 minutes
                Statistics = new List<string> { "Average" }
            };

            var response = await _cloudWatch.GetMetricStatisticsAsync(request);
            
            return response.Datapoints
                .OrderBy(d => d.Timestamp)
                .Select(d => new MetricDataPoint
                {
                    Timestamp = d.Timestamp.ToString("O"),
                    Value = d.Average
                })
                .ToList();
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to get metric history for {MetricName} from {Namespace}", metricName, nameSpace);
            return new List<MetricDataPoint>();
        }
    }
}