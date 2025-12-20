using MySql.Data.MySqlClient;

namespace MonitoringDashboard.Api.Services;

public class MonitoredResourceService
{
    private readonly AWSAccountService _accountService;
    private readonly ILogger<MonitoredResourceService> _logger;

    public MonitoredResourceService(AWSAccountService accountService, ILogger<MonitoredResourceService> logger)
    {
        _accountService = accountService;
        _logger = logger;
    }

    public async Task SaveMonitoredResourcesAsync(string accountId, List<MonitoredResource> resources)
    {
        var connectionString = await _accountService.GetConnectionStringAsync();
        using var connection = new MySqlConnection(connectionString);
        await connection.OpenAsync();

        // Delete existing resources
        var deleteQuery = "DELETE FROM monitored_resources WHERE aws_account_id = @accountId";
        using var deleteCmd = new MySqlCommand(deleteQuery, connection);
        deleteCmd.Parameters.AddWithValue("@accountId", accountId);
        await deleteCmd.ExecuteNonQueryAsync();

        // Insert new resources
        foreach (var resource in resources)
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
    }

    public async Task<List<object>> GetMonitoredResourcesAsync(string accountId)
    {
        var connectionString = await _accountService.GetConnectionStringAsync();
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

        return resources;
    }
}

public class MonitoredResource
{
    public string Type { get; set; } = string.Empty;
    public string ResourceId { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public bool IsEnabled { get; set; } = true;
}

public class SaveResourcesRequest
{
    public List<MonitoredResource> Resources { get; set; } = new();
}
