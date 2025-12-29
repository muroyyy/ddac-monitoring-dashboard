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

    public async Task<List<object>> DiscoverCloudFrontDistributionsAsync(BasicAWSCredentials credentials)
    {
        try
        {
            // CloudFront is a global service - use us-east-1
            using var cloudFrontClient = new Amazon.CloudFront.AmazonCloudFrontClient(credentials, Amazon.RegionEndpoint.USEast1);
            var response = await cloudFrontClient.ListDistributionsAsync(new Amazon.CloudFront.Model.ListDistributionsRequest());

            if (response.DistributionList?.Items == null)
                return new List<object>();

            return response.DistributionList.Items.Select(dist => new
            {
                distributionId = dist.Id,
                domainName = dist.DomainName,
                status = dist.Status,
                enabled = dist.Enabled,
                aliases = dist.Aliases?.Items ?? new List<string>()
            }).Cast<object>().ToList();
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to discover CloudFront distributions");
            return new List<object>();
        }
    }

    public async Task<List<object>> DiscoverRoute53HealthChecksAsync(BasicAWSCredentials credentials)
    {
        try
        {
            // Route53 is a global service - use us-east-1
            using var route53Client = new Amazon.Route53.AmazonRoute53Client(credentials, Amazon.RegionEndpoint.USEast1);
            var response = await route53Client.ListHealthChecksAsync(new Amazon.Route53.Model.ListHealthChecksRequest());

            return response.HealthChecks.Select(hc => new
            {
                healthCheckId = hc.Id,
                type = hc.HealthCheckConfig?.Type?.Value ?? "Unknown",
                fqdn = hc.HealthCheckConfig?.FullyQualifiedDomainName ?? "",
                resourcePath = hc.HealthCheckConfig?.ResourcePath ?? "/",
                port = hc.HealthCheckConfig?.Port ?? 0
            }).Cast<object>().ToList();
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to discover Route53 health checks");
            return new List<object>();
        }
    }
}
