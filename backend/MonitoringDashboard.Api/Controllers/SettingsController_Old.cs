using Microsoft.AspNetCore.Mvc;
using Amazon.CloudWatch;
using Amazon.CloudWatch.Model;
using Amazon.Runtime;
using MySql.Data.MySqlClient;
using MonitoringDashboard.Api.Services;

namespace MonitoringDashboard.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SettingsController : ControllerBase
{
    private readonly ILogger<SettingsController> _logger;
    private readonly SecretsManagerService _secretsManager;
    private readonly IConfiguration _configuration;

    public SettingsController(ILogger<SettingsController> logger, SecretsManagerService secretsManager, IConfiguration configuration)
    {
        _logger = logger;
        _secretsManager = secretsManager;
        _configuration = configuration;
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
            var listRequest = new ListMetricsRequest();
            
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

    [HttpPost("accounts")]
    public async Task<IActionResult> SaveAccount([FromBody] SaveAccountRequest request)
    {
        try
        {
            var sessionToken = Request.Headers["Authorization"].ToString().Replace("Bearer ", "");
            var userId = await GetUserIdFromSession(sessionToken);
            if (userId == null) return Unauthorized();

            var connectionString = await GetConnectionStringAsync();
            using var connection = new MySqlConnection(connectionString);
            await connection.OpenAsync();

            var query = @"INSERT INTO aws_accounts (id, user_id, account_name, account_id, access_key_id, secret_access_key, region, is_validated) 
                         VALUES (@id, @userId, @accountName, @accountId, @accessKeyId, @secretAccessKey, @region, @isValidated)
                         ON DUPLICATE KEY UPDATE account_name=@accountName, account_id=@accountId, access_key_id=@accessKeyId, 
                         secret_access_key=@secretAccessKey, region=@region, is_validated=@isValidated";

            using var cmd = new MySqlCommand(query, connection);
            cmd.Parameters.AddWithValue("@id", request.Id);
            cmd.Parameters.AddWithValue("@userId", userId);
            cmd.Parameters.AddWithValue("@accountName", request.AccountName);
            cmd.Parameters.AddWithValue("@accountId", request.AccountId);
            cmd.Parameters.AddWithValue("@accessKeyId", request.AccessKeyId);
            cmd.Parameters.AddWithValue("@secretAccessKey", request.SecretAccessKey);
            cmd.Parameters.AddWithValue("@region", request.Region);
            cmd.Parameters.AddWithValue("@isValidated", request.IsValidated);

            await cmd.ExecuteNonQueryAsync();
            return Ok(new { message = "Account saved successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error saving account");
            return BadRequest(new { message = "Failed to save account" });
        }
    }

    [HttpGet("accounts")]
    public async Task<IActionResult> GetAccounts()
    {
        try
        {
            var sessionToken = Request.Headers["Authorization"].ToString().Replace("Bearer ", "");
            var userId = await GetUserIdFromSession(sessionToken);
            if (userId == null) return Unauthorized();

            var connectionString = await GetConnectionStringAsync();
            using var connection = new MySqlConnection(connectionString);
            await connection.OpenAsync();

            var query = "SELECT id, account_name, account_id, access_key_id, secret_access_key, region, is_validated, created_at FROM aws_accounts WHERE user_id = @userId";
            using var cmd = new MySqlCommand(query, connection);
            cmd.Parameters.AddWithValue("@userId", userId);

            var accounts = new List<object>();
            using var reader = await cmd.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                accounts.Add(new
                {
                    id = reader.GetString(0),
                    accountName = reader.GetString(1),
                    accountId = reader.GetString(2),
                    accessKeyId = reader.GetString(3),
                    secretAccessKey = reader.GetString(4),
                    region = reader.GetString(5),
                    isValidated = reader.GetBoolean(6),
                    createdAt = reader.GetDateTime(7).ToString("o")
                });
            }

            return Ok(accounts);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching accounts");
            return BadRequest(new { message = "Failed to fetch accounts" });
        }
    }

    [HttpDelete("accounts/{id}")]
    public async Task<IActionResult> DeleteAccount(string id)
    {
        try
        {
            var sessionToken = Request.Headers["Authorization"].ToString().Replace("Bearer ", "");
            var userId = await GetUserIdFromSession(sessionToken);
            if (userId == null) return Unauthorized();

            var connectionString = await GetConnectionStringAsync();
            using var connection = new MySqlConnection(connectionString);
            await connection.OpenAsync();

            var query = "DELETE FROM aws_accounts WHERE id = @id AND user_id = @userId";
            using var cmd = new MySqlCommand(query, connection);
            cmd.Parameters.AddWithValue("@id", id);
            cmd.Parameters.AddWithValue("@userId", userId);

            await cmd.ExecuteNonQueryAsync();
            return Ok(new { message = "Account deleted successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting account");
            return BadRequest(new { message = "Failed to delete account" });
        }
    }

    private async Task<string> GetConnectionStringAsync()
    {
        var secretName = _configuration["AWS:RdsSecretName"] ?? "ddac-monitoring-dev-rds-credentials";
        var credentials = await _secretsManager.GetRdsCredentialsAsync(secretName);
        if (credentials == null) throw new Exception("Failed to retrieve database credentials");
        
        return $"Server={credentials.host};Port={credentials.port};Database={credentials.dbname};User={credentials.username};Password={credentials.password};";
    }

    private async Task<int?> GetUserIdFromSession(string sessionToken)
    {
        try
        {
            var connectionString = await GetConnectionStringAsync();
            using var connection = new MySqlConnection(connectionString);
            await connection.OpenAsync();

            var query = "SELECT user_id FROM user_sessions WHERE session_token = @token AND expires_at > NOW()";
            using var cmd = new MySqlCommand(query, connection);
            cmd.Parameters.AddWithValue("@token", sessionToken);

            var result = await cmd.ExecuteScalarAsync();
            return result != null ? Convert.ToInt32(result) : null;
        }
        catch
        {
            return null;
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

    [HttpPost("accounts/{accountId}/resources")]
    public async Task<IActionResult> SaveMonitoredResources(string accountId, [FromBody] SaveResourcesRequest request)
    {
        try
        {
            var sessionToken = Request.Headers["Authorization"].ToString().Replace("Bearer ", "");
            var userId = await GetUserIdFromSession(sessionToken);
            if (userId == null) return Unauthorized();

            var connectionString = await GetConnectionStringAsync();
            using var connection = new MySqlConnection(connectionString);
            await connection.OpenAsync();

            // Delete existing resources for this account
            var deleteQuery = "DELETE FROM monitored_resources WHERE aws_account_id = @accountId";
            using var deleteCmd = new MySqlCommand(deleteQuery, connection);
            deleteCmd.Parameters.AddWithValue("@accountId", accountId);
            await deleteCmd.ExecuteNonQueryAsync();

            // Insert new resources
            foreach (var resource in request.Resources)
            {
                var insertQuery = @"INSERT INTO monitored_resources (aws_account_id, resource_type, resource_id, resource_name, is_enabled) 
                                   VALUES (@accountId, @type, @resourceId, @name, @enabled)";
                using var insertCmd = new MySqlCommand(insertQuery, connection);
                insertCmd.Parameters.AddWithValue("@accountId", accountId);
                insertCmd.Parameters.AddWithValue("@type", resource.Type);
                insertCmd.Parameters.AddWithValue("@resourceId", resource.ResourceId);
                insertCmd.Parameters.AddWithValue("@name", resource.Name);
                insertCmd.Parameters.AddWithValue("@enabled", resource.IsEnabled);
                await insertCmd.ExecuteNonQueryAsync();
            }

            return Ok(new { message = "Resources saved successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error saving monitored resources");
            return BadRequest(new { message = "Failed to save resources" });
        }
    }

    [HttpGet("accounts/{accountId}/resources")]
    public async Task<IActionResult> GetMonitoredResources(string accountId)
    {
        try
        {
            var sessionToken = Request.Headers["Authorization"].ToString().Replace("Bearer ", "");
            var userId = await GetUserIdFromSession(sessionToken);
            if (userId == null) return Unauthorized();

            var connectionString = await GetConnectionStringAsync();
            using var connection = new MySqlConnection(connectionString);
            await connection.OpenAsync();

            var query = "SELECT resource_type, resource_id, resource_name, is_enabled FROM monitored_resources WHERE aws_account_id = @accountId";
            using var cmd = new MySqlCommand(query, connection);
            cmd.Parameters.AddWithValue("@accountId", accountId);

            var resources = new List<object>();
            using var reader = await cmd.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                resources.Add(new
                {
                    type = reader.GetString(0),
                    resourceId = reader.GetString(1),
                    name = reader.GetString(2),
                    isEnabled = reader.GetBoolean(3)
                });
            }

            return Ok(resources);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching monitored resources");
            return BadRequest(new { message = "Failed to fetch resources" });
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

public class SaveAccountRequest
{
    public string Id { get; set; } = string.Empty;
    public string AccountName { get; set; } = string.Empty;
    public string AccountId { get; set; } = string.Empty;
    public string AccessKeyId { get; set; } = string.Empty;
    public string SecretAccessKey { get; set; } = string.Empty;
    public string Region { get; set; } = string.Empty;
    public bool IsValidated { get; set; }
}

public class SaveResourcesRequest
{
    public List<MonitoredResource> Resources { get; set; } = new();
}

public class MonitoredResource
{
    public string Type { get; set; } = string.Empty;
    public string ResourceId { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public bool IsEnabled { get; set; } = true;
}
