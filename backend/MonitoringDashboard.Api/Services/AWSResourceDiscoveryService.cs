using Amazon.Runtime;

namespace MonitoringDashboard.Api.Services;

public class AWSResourceDiscoveryService
{
    private readonly ILogger<AWSResourceDiscoveryService> _logger;

    public AWSResourceDiscoveryService(ILogger<AWSResourceDiscoveryService> logger)
    {
        _logger = logger;
    }

    public async Task<List<object>> DiscoverEC2InstancesAsync(BasicAWSCredentials credentials, Amazon.RegionEndpoint region)
    {
        try
        {
            using var ec2Client = new Amazon.EC2.AmazonEC2Client(credentials, region);
            var response = await ec2Client.DescribeInstancesAsync();
            
            var instances = new List<object>();
            foreach (var reservation in response.Reservations)
            {
                foreach (var instance in reservation.Instances)
                {
                    var nameTag = instance.Tags?.FirstOrDefault(t => t.Key == "Name")?.Value ?? "Unnamed";
                    instances.Add(new
                    {
                        instanceId = instance.InstanceId,
                        name = nameTag,
                        instanceType = instance.InstanceType.Value,
                        state = instance.State.Name.Value
                    });
                }
            }
            return instances;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to discover EC2 instances");
            return new List<object>();
        }
    }

    public async Task<List<object>> DiscoverRDSInstancesAsync(BasicAWSCredentials credentials, Amazon.RegionEndpoint region)
    {
        try
        {
            using var rdsClient = new Amazon.RDS.AmazonRDSClient(credentials, region);
            var response = await rdsClient.DescribeDBInstancesAsync();
            
            return response.DBInstances.Select(db => new
            {
                identifier = db.DBInstanceIdentifier,
                engine = $"{db.Engine} {db.EngineVersion}",
                instanceClass = db.DBInstanceClass,
                status = db.DBInstanceStatus
            }).Cast<object>().ToList();
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to discover RDS instances");
            return new List<object>();
        }
    }

    public async Task<List<object>> DiscoverLambdaFunctionsAsync(BasicAWSCredentials credentials, Amazon.RegionEndpoint region)
    {
        try
        {
            using var lambdaClient = new Amazon.Lambda.AmazonLambdaClient(credentials, region);
            var response = await lambdaClient.ListFunctionsAsync();
            
            return response.Functions.Select(fn => new
            {
                functionName = fn.FunctionName,
                runtime = fn.Runtime.Value,
                memorySize = fn.MemorySize
            }).Cast<object>().ToList();
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to discover Lambda functions");
            return new List<object>();
        }
    }

    public async Task<List<object>> DiscoverS3BucketsAsync(BasicAWSCredentials credentials, Amazon.RegionEndpoint region)
    {
        try
        {
            using var s3Client = new Amazon.S3.AmazonS3Client(credentials, region);
            var response = await s3Client.ListBucketsAsync();
            
            return response.Buckets.Select(bucket => new
            {
                bucketName = bucket.BucketName,
                creationDate = bucket.CreationDate
            }).Cast<object>().ToList();
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to discover S3 buckets");
            return new List<object>();
        }
    }
}
