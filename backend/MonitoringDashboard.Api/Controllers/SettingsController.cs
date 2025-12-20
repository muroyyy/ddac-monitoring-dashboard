using Microsoft.AspNetCore.Mvc;
using Amazon.CloudWatch;
using Amazon.CloudWatch.Model;
using Amazon.Runtime;

namespace MonitoringDashboard.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SettingsController : ControllerBase
{
    private readonly ILogger<SettingsController> _logger;

    public SettingsController(ILogger<SettingsController> logger)
    {
        _logger = logger;
    }

    [HttpPost("validate-credentials")]
    public async Task<IActionResult> ValidateCredentials([FromBody] ValidateCredentialsRequest request)
    {
        try
        {
            var credentials = new BasicAWSCredentials(request.AccessKeyId, request.SecretAccessKey);
            var config = new AmazonCloudWatchConfig
            {
                RegionEndpoint = Amazon.RegionEndpoint.GetBySystemName(request.Region)
            };

            using var client = new AmazonCloudWatchClient(credentials, config);
            
            // Test connection by listing metrics
            var listRequest = new ListMetricsRequest
            {
                MaxRecords = 1
            };
            
            await client.ListMetricsAsync(listRequest);

            return Ok(new { message = "Credentials validated successfully" });
        }
        catch (AmazonServiceException ex)
        {
            _logger.LogError(ex, "AWS service error validating credentials");
            return BadRequest(new { message = $"AWS Error: {ex.Message}" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error validating credentials");
            return BadRequest(new { message = "Failed to validate credentials" });
        }
    }

    [HttpPost("discover-resources")]
    public async Task<IActionResult> DiscoverResources([FromBody] DiscoverResourcesRequest request)
    {
        try
        {
            var credentials = new BasicAWSCredentials(request.AccessKeyId, request.SecretAccessKey);
            var region = Amazon.RegionEndpoint.GetBySystemName(request.Region);

            var resources = new
            {
                ec2Instances = await DiscoverEC2InstancesAsync(credentials, region),
                rdsInstances = await DiscoverRDSInstancesAsync(credentials, region),
                lambdaFunctions = await DiscoverLambdaFunctionsAsync(credentials, region),
                s3Buckets = await DiscoverS3BucketsAsync(credentials, region)
            };

            return Ok(resources);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error discovering resources");
            return BadRequest(new { message = "Failed to discover resources" });
        }
    }

    private async Task<List<object>> DiscoverEC2InstancesAsync(BasicAWSCredentials credentials, Amazon.RegionEndpoint region)
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

    private async Task<List<object>> DiscoverRDSInstancesAsync(BasicAWSCredentials credentials, Amazon.RegionEndpoint region)
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

    private async Task<List<object>> DiscoverLambdaFunctionsAsync(BasicAWSCredentials credentials, Amazon.RegionEndpoint region)
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

    private async Task<List<object>> DiscoverS3BucketsAsync(BasicAWSCredentials credentials, Amazon.RegionEndpoint region)
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

public class ValidateCredentialsRequest
{
    public string AccessKeyId { get; set; } = string.Empty;
    public string SecretAccessKey { get; set; } = string.Empty;
    public string Region { get; set; } = string.Empty;
}

public class DiscoverResourcesRequest
{
    public string AccessKeyId { get; set; } = string.Empty;
    public string SecretAccessKey { get; set; } = string.Empty;
    public string Region { get; set; } = string.Empty;
}
