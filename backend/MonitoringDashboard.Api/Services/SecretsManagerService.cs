using Amazon.SecretsManager;
using Amazon.SecretsManager.Model;
using System.Text.Json;

namespace MonitoringDashboard.Api.Services;

public class SecretsManagerService
{
    private readonly IAmazonSecretsManager _secretsManager;
    private readonly ILogger<SecretsManagerService> _logger;

    public SecretsManagerService(IAmazonSecretsManager secretsManager, ILogger<SecretsManagerService> logger)
    {
        _secretsManager = secretsManager;
        _logger = logger;
    }

    public async Task<RdsCredentials?> GetRdsCredentialsAsync(string secretName)
    {
        try
        {
            var request = new GetSecretValueRequest
            {
                SecretId = secretName
            };

            var response = await _secretsManager.GetSecretValueAsync(request);
            var secret = JsonSerializer.Deserialize<RdsCredentials>(response.SecretString);
            return secret;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving RDS credentials from Secrets Manager");
            return null;
        }
    }
}

public class RdsCredentials
{
    public string endpoint { get; set; } = string.Empty;
    public string host { get; set; } = string.Empty;
    public int port { get; set; }
    public string dbname { get; set; } = string.Empty;
    public string username { get; set; } = string.Empty;
    public string password { get; set; } = string.Empty;
}
