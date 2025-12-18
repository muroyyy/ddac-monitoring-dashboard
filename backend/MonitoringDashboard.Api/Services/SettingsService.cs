using System.Text.Json;
using Amazon.SimpleSystemsManagement;
using Amazon.SimpleSystemsManagement.Model;
using MonitoringDashboard.Api.Models;

namespace MonitoringDashboard.Api.Services;

public class SettingsService : ISettingsService
{
    private readonly IAmazonSimpleSystemsManagement _ssm;
    private readonly ILogger<SettingsService> _logger;
    private readonly string _parameterName = "/monitoring-dashboard/settings";
    private MonitoringSettings? _cachedSettings;

    public SettingsService(IAmazonSimpleSystemsManagement ssm, ILogger<SettingsService> logger)
    {
        _ssm = ssm;
        _logger = logger;
    }

    public async Task<MonitoringSettings> GetSettingsAsync()
    {
        if (_cachedSettings != null)
            return _cachedSettings;

        try
        {
            // Try to get settings from SSM Parameter Store
            var request = new GetParameterRequest
            {
                Name = _parameterName,
                WithDecryption = true
            };

            var response = await _ssm.GetParameterAsync(request);
            var settings = JsonSerializer.Deserialize<MonitoringSettings>(response.Parameter.Value);
            
            if (settings != null)
            {
                _cachedSettings = settings;
                return settings;
            }
        }
        catch (ParameterNotFoundException)
        {
            _logger.LogInformation("Settings parameter not found in SSM, using defaults");
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to retrieve settings from SSM, using defaults");
        }

        // Return default settings if SSM parameter doesn't exist or fails
        _cachedSettings = GetDefaultSettings();
        return _cachedSettings;
    }

    public async Task<bool> SaveSettingsAsync(MonitoringSettings settings)
    {
        try
        {
            settings.UpdatedAt = DateTime.UtcNow.ToString("O");
            var json = JsonSerializer.Serialize(settings, new JsonSerializerOptions { WriteIndented = true });

            var request = new PutParameterRequest
            {
                Name = _parameterName,
                Value = json,
                Type = ParameterType.SecureString,
                Overwrite = true,
                Description = "Monitoring Dashboard Configuration"
            };

            await _ssm.PutParameterAsync(request);
            _cachedSettings = settings; // Update cache
            
            _logger.LogInformation("Settings saved successfully to SSM Parameter Store");
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to save settings to SSM Parameter Store");
            return false;
        }
    }

    private static MonitoringSettings GetDefaultSettings()
    {
        return new MonitoringSettings
        {
            Aws = new AWSSettings
            {
                Region = "ap-southeast-1",
                Environment = "dev",
                SourceAccountId = ""
            },
            Ec2 = new EC2Settings
            {
                InstanceId = "",
                EnableDetailedMonitoring = true,
                RefreshInterval = 30
            },
            Rds = new RDSSettings
            {
                DbInstanceIdentifier = "",
                EnablePerformanceInsights = true
            },
            Serverless = new ServerlessSettings
            {
                LambdaFunctionNames = new List<string>(),
                ApiGatewayId = "",
                ApiGatewayStage = "prod"
            },
            Thresholds = new ThresholdSettings
            {
                CpuWarning = 70.0,
                CpuCritical = 90.0,
                MemoryWarning = 80.0,
                MemoryCritical = 95.0,
                ErrorRateWarning = 5.0,
                ErrorRateCritical = 10.0
            },
            UpdatedAt = DateTime.UtcNow.ToString("O")
        };
    }
}