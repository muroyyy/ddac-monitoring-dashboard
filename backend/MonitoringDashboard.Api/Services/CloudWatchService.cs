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
            var diskHistoryTask = GetMetricHistoryAsync("CWAgent", "disk_used_percent", "InstanceId", instanceId, startTime, endTime);

            await Task.WhenAll(cpuTask, networkInTask, networkOutTask, memoryTask, diskTask, cpuHistoryTask, memoryHistoryTask, diskHistoryTask);

            return new EC2Metrics
            {
                CpuUtilization = await cpuTask,
                MemoryUtilization = await memoryTask,
                DiskUsage = await diskTask,
                NetworkIn = await networkInTask / 1024 / 1024, // Convert to MB
                NetworkOut = await networkOutTask / 1024 / 1024, // Convert to MB
                CpuHistory = await cpuHistoryTask,
                MemoryHistory = await memoryHistoryTask,
                DiskHistory = await diskHistoryTask
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

    public async Task<CloudFrontMetrics> GetCloudFrontMetricsAsync(string distributionId, BasicAWSCredentials credentials)
    {
        try
        {
            var endTime = DateTime.UtcNow;
            var startTime = endTime.AddMinutes(-30);

            // CRITICAL: CloudFront metrics are ONLY available in us-east-1
            using var usEast1Client = new AmazonCloudWatchClient(credentials, Amazon.RegionEndpoint.USEast1);

            var dimensions = new List<Dimension>
            {
                new() { Name = "DistributionId", Value = distributionId },
                new() { Name = "Region", Value = "Global" }
            };

            // Fetch current metrics
            var requestsTask = GetMetricFromClientAsync(usEast1Client, "AWS/CloudFront", "Requests", dimensions, "Sum");
            var cacheHitTask = GetMetricFromClientAsync(usEast1Client, "AWS/CloudFront", "CacheHitRate", dimensions, "Average");
            var error4xxTask = GetMetricFromClientAsync(usEast1Client, "AWS/CloudFront", "4xxErrorRate", dimensions, "Average");
            var error5xxTask = GetMetricFromClientAsync(usEast1Client, "AWS/CloudFront", "5xxErrorRate", dimensions, "Average");
            var originLatencyTask = GetMetricFromClientAsync(usEast1Client, "AWS/CloudFront", "OriginLatency", dimensions, "Average");

            // Fetch history
            var requestsHistoryTask = GetMetricHistoryFromClientAsync(usEast1Client, "AWS/CloudFront", "Requests", dimensions, startTime, endTime, "Sum");
            var cacheHitHistoryTask = GetMetricHistoryFromClientAsync(usEast1Client, "AWS/CloudFront", "CacheHitRate", dimensions, startTime, endTime, "Average");

            await Task.WhenAll(requestsTask, cacheHitTask, error4xxTask, error5xxTask, originLatencyTask, requestsHistoryTask, cacheHitHistoryTask);

            return new CloudFrontMetrics
            {
                DistributionId = distributionId,
                Requests = (long)await requestsTask,
                CacheHitRate = await cacheHitTask,
                Error4xxRate = await error4xxTask,
                Error5xxRate = await error5xxTask,
                OriginLatency = await originLatencyTask,
                RequestsHistory = await requestsHistoryTask,
                CacheHitRateHistory = await cacheHitHistoryTask
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving CloudFront metrics for distribution {DistributionId}", distributionId);
            return new CloudFrontMetrics { DistributionId = distributionId };
        }
    }

    public async Task<S3Metrics> GetS3MetricsAsync(string bucketName)
    {
        try
        {
            var endTime = DateTime.UtcNow;
            var startTime = endTime.AddDays(-2); // S3 storage metrics are daily

            // Storage metrics require StorageType dimension
            var storageDimensions = new List<Dimension>
            {
                new() { Name = "BucketName", Value = bucketName },
                new() { Name = "StorageType", Value = "StandardStorage" }
            };

            // Request metrics dimensions
            var requestDimensions = new List<Dimension>
            {
                new() { Name = "BucketName", Value = bucketName },
                new() { Name = "FilterId", Value = "EntireBucket" }
            };

            // Storage metrics (daily, use longer period)
            var sizeTask = GetLatestMetricValueAsync("AWS/S3", "BucketSizeBytes", storageDimensions, 86400);
            var objectsTask = GetLatestMetricValueAsync("AWS/S3", "NumberOfObjects", storageDimensions, 86400);

            // Request metrics (5 minute period)
            var allRequestsTask = GetLatestMetricValueAsync("AWS/S3", "AllRequests", requestDimensions);
            var error4xxTask = GetLatestMetricValueAsync("AWS/S3", "4xxErrors", requestDimensions);
            var error5xxTask = GetLatestMetricValueAsync("AWS/S3", "5xxErrors", requestDimensions);

            // History
            var requestsHistoryTask = GetMetricHistoryAsync("AWS/S3", "AllRequests", requestDimensions, endTime.AddMinutes(-30), endTime);
            var sizeHistoryTask = GetMetricHistoryAsync("AWS/S3", "BucketSizeBytes", storageDimensions, startTime, endTime, 86400);

            await Task.WhenAll(sizeTask, objectsTask, allRequestsTask, error4xxTask, error5xxTask, requestsHistoryTask, sizeHistoryTask);

            return new S3Metrics
            {
                BucketName = bucketName,
                BucketSizeBytes = await sizeTask,
                NumberOfObjects = (long)await objectsTask,
                AllRequests = (long)await allRequestsTask,
                Error4xxCount = (int)await error4xxTask,
                Error5xxCount = (int)await error5xxTask,
                RequestsHistory = await requestsHistoryTask,
                BucketSizeHistory = await sizeHistoryTask
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving S3 metrics for bucket {BucketName}", bucketName);
            return new S3Metrics { BucketName = bucketName };
        }
    }

    public async Task<Route53Metrics> GetRoute53MetricsAsync(string hostedZoneId, string hostedZoneName, BasicAWSCredentials credentials)
    {
        try
        {
            var endTime = DateTime.UtcNow;
            var startTime = endTime.AddMinutes(-30);

            // CRITICAL: Route53 metrics are ONLY available in us-east-1
            using var usEast1Client = new AmazonCloudWatchClient(credentials, Amazon.RegionEndpoint.USEast1);

            var dimensions = new List<Dimension>
            {
                new() { Name = "HostedZoneId", Value = hostedZoneId }
            };

            var dnsQueriesTask = GetMetricFromClientAsync(usEast1Client, "AWS/Route53", "DNSQueries", dimensions, "Sum");
            var dnsQueriesHistoryTask = GetMetricHistoryFromClientAsync(usEast1Client, "AWS/Route53", "DNSQueries", dimensions, startTime, endTime, "Sum");

            await Task.WhenAll(dnsQueriesTask, dnsQueriesHistoryTask);

            return new Route53Metrics
            {
                HostedZoneId = hostedZoneId,
                HostedZoneName = hostedZoneName,
                DNSQueries = (long)await dnsQueriesTask,
                DNSQueriesHistory = await dnsQueriesHistoryTask
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving Route53 metrics for hosted zone {HostedZoneId}", hostedZoneId);
            return new Route53Metrics { HostedZoneId = hostedZoneId, HostedZoneName = hostedZoneName };
        }
    }

    private async Task<double> GetLatestMetricValueAsync(string nameSpace, string metricName, string dimensionName, string dimensionValue)
    {
        var dimensions = new List<Dimension> { new() { Name = dimensionName, Value = dimensionValue } };
        return await GetLatestMetricValueAsync(nameSpace, metricName, dimensions);
    }

    private async Task<double> GetLatestMetricValueAsync(string nameSpace, string metricName, List<Dimension> dimensions, int period = 300)
    {
        try
        {
            var lookback = period >= 86400 ? -48 * 60 : -10; // 2 days for daily metrics, 10 min otherwise
            var request = new GetMetricStatisticsRequest
            {
                Namespace = nameSpace,
                MetricName = metricName,
                Dimensions = dimensions,
                StartTimeUtc = DateTime.UtcNow.AddMinutes(lookback),
                EndTimeUtc = DateTime.UtcNow,
                Period = period,
                Statistics = new List<string> { "Average" }
            };

            var response = await _cloudWatch.GetMetricStatisticsAsync(request);
            var lastDatapoint = response.Datapoints.OrderByDescending(d => d.Timestamp).FirstOrDefault();
            return lastDatapoint?.Average ?? 0.0;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to get metric {MetricName} from {Namespace}", metricName, nameSpace);
            return 0.0;
        }
    }

    private async Task<double> GetMetricFromClientAsync(IAmazonCloudWatch client, string nameSpace, string metricName, List<Dimension> dimensions, string statistic)
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
                Period = 300,
                Statistics = new List<string> { statistic }
            };

            var response = await client.GetMetricStatisticsAsync(request);
            var lastDatapoint = response.Datapoints.OrderByDescending(d => d.Timestamp).FirstOrDefault();

            return statistic switch
            {
                "Sum" => lastDatapoint?.Sum ?? 0.0,
                "Minimum" => lastDatapoint?.Minimum ?? 0.0,
                "Maximum" => lastDatapoint?.Maximum ?? 0.0,
                _ => lastDatapoint?.Average ?? 0.0
            };
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to get metric {MetricName} from {Namespace}", metricName, nameSpace);
            return 0.0;
        }
    }

    private async Task<List<MetricDataPoint>> GetMetricHistoryFromClientAsync(IAmazonCloudWatch client, string nameSpace, string metricName, List<Dimension> dimensions, DateTime startTime, DateTime endTime, string statistic)
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
                Period = 300,
                Statistics = new List<string> { statistic }
            };

            var response = await client.GetMetricStatisticsAsync(request);

            return response.Datapoints
                .OrderBy(d => d.Timestamp)
                .Select(d => new MetricDataPoint
                {
                    Timestamp = d.Timestamp.ToString("O"),
                    Value = statistic switch
                    {
                        "Sum" => d.Sum,
                        "Minimum" => d.Minimum,
                        "Maximum" => d.Maximum,
                        _ => d.Average
                    }
                })
                .ToList();
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to get metric history for {MetricName} from {Namespace}", metricName, nameSpace);
            return new List<MetricDataPoint>();
        }
    }

    private async Task<List<MetricDataPoint>> GetMetricHistoryAsync(string nameSpace, string metricName, List<Dimension> dimensions, DateTime startTime, DateTime endTime, int period)
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
                Period = period,
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