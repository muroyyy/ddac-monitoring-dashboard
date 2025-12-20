using Microsoft.AspNetCore.Mvc;
using Amazon.CloudWatch;
using Amazon.CloudWatch.Model;
using Amazon.Runtime;
using MonitoringDashboard.Api.Services;

namespace MonitoringDashboard.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SettingsController : ControllerBase
{
    private readonly ILogger<SettingsController> _logger;
    private readonly AWSAccountService _accountService;
    private readonly AWSResourceDiscoveryService _discoveryService;
    private readonly MonitoredResourceService _resourceService;

    public SettingsController(
        ILogger<SettingsController> logger,
        AWSAccountService accountService,
        AWSResourceDiscoveryService discoveryService,
        MonitoredResourceService resourceService)
    {
        _logger = logger;
        _accountService = accountService;
        _discoveryService = discoveryService;
        _resourceService = resourceService;
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
            await client.ListMetricsAsync(new ListMetricsRequest());

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
                ec2Instances = await _discoveryService.DiscoverEC2InstancesAsync(credentials, region),
                rdsInstances = await _discoveryService.DiscoverRDSInstancesAsync(credentials, region),
                lambdaFunctions = await _discoveryService.DiscoverLambdaFunctionsAsync(credentials, region),
                s3Buckets = await _discoveryService.DiscoverS3BucketsAsync(credentials, region)
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
            var userId = await _accountService.GetUserIdFromSessionAsync(sessionToken);
            if (userId == null) return Unauthorized();

            await _accountService.SaveAccountAsync(userId.Value, request);
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
            var userId = await _accountService.GetUserIdFromSessionAsync(sessionToken);
            if (userId == null) return Unauthorized();

            var accounts = await _accountService.GetAccountsAsync(userId.Value);
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
            var userId = await _accountService.GetUserIdFromSessionAsync(sessionToken);
            if (userId == null) return Unauthorized();

            await _accountService.DeleteAccountAsync(userId.Value, id);
            return Ok(new { message = "Account deleted successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting account");
            return BadRequest(new { message = "Failed to delete account" });
        }
    }

    [HttpPost("accounts/{accountId}/resources")]
    public async Task<IActionResult> SaveMonitoredResources(string accountId, [FromBody] SaveResourcesRequest request)
    {
        try
        {
            var sessionToken = Request.Headers["Authorization"].ToString().Replace("Bearer ", "");
            var userId = await _accountService.GetUserIdFromSessionAsync(sessionToken);
            if (userId == null) return Unauthorized();

            await _resourceService.SaveMonitoredResourcesAsync(accountId, request.Resources);
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
            var userId = await _accountService.GetUserIdFromSessionAsync(sessionToken);
            if (userId == null) return Unauthorized();

            var resources = await _resourceService.GetMonitoredResourcesAsync(accountId);
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
