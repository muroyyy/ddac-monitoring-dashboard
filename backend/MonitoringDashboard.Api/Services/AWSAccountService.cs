using MySql.Data.MySqlClient;

namespace MonitoringDashboard.Api.Services;

public class AWSAccountService
{
    private readonly SecretsManagerService _secretsManager;
    private readonly IConfiguration _configuration;
    private readonly ILogger<AWSAccountService> _logger;

    public AWSAccountService(SecretsManagerService secretsManager, IConfiguration configuration, ILogger<AWSAccountService> logger)
    {
        _secretsManager = secretsManager;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task<string> GetConnectionStringAsync()
    {
        var secretName = _configuration["AWS:RdsSecretName"] ?? "ddac-monitoring-dev-rds-credentials";
        var credentials = await _secretsManager.GetRdsCredentialsAsync(secretName);
        if (credentials == null) throw new Exception("Failed to retrieve database credentials");
        
        return $"Server={credentials.host};Port={credentials.port};Database={credentials.dbname};User={credentials.username};Password={credentials.password};";
    }

    public async Task<int?> GetUserIdFromSessionAsync(string sessionToken)
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

    public async Task SaveAccountAsync(int userId, SaveAccountRequest request)
    {
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
    }

    public async Task<List<object>> GetAccountsAsync(int userId)
    {
        var connectionString = await GetConnectionStringAsync();
        using var connection = new MySqlConnection(connectionString);
        await connection.OpenAsync();

        var query = "SELECT id, account_name, account_id, access_key_id, secret_access_key, region, is_validated, created_at FROM aws_accounts WHERE user_id = @userId";
        using var cmd = new MySqlCommand(query, connection);
        cmd.Parameters.AddWithValue("@userId", userId);

        var accounts = new List<object>();
        var accountIds = new List<string>();

        using (var reader = await cmd.ExecuteReaderAsync())
        {
            while (await reader.ReadAsync())
            {
                var accId = reader.GetString(0);
                accountIds.Add(accId);
                accounts.Add(new
                {
                    id = accId,
                    accountName = reader.GetString(1),
                    accountId = reader.GetString(2),
                    accessKeyId = reader.GetString(3),
                    secretAccessKey = reader.GetString(4),
                    region = reader.GetString(5),
                    isValidated = reader.GetBoolean(6),
                    createdAt = reader.GetDateTime(7).ToString("o"),
                    cloudFrontDistributionId = (string?)null,
                    s3BucketName = (string?)null,
                    route53HealthCheckId = (string?)null
                });
            }
        }

        // Fetch monitored resources for each account and update the accounts list
        for (int i = 0; i < accounts.Count; i++)
        {
            var account = accounts[i];
            var accId = accountIds[i];

            var resourceQuery = "SELECT resource_type, resource_id FROM monitored_resources WHERE aws_account_id = @accountId AND is_enabled = 1";
            using var resourceCmd = new MySqlCommand(resourceQuery, connection);
            resourceCmd.Parameters.AddWithValue("@accountId", accId);

            string? cloudFrontId = null, s3Bucket = null, route53Id = null;

            using var resourceReader = await resourceCmd.ExecuteReaderAsync();
            while (await resourceReader.ReadAsync())
            {
                var resourceType = resourceReader.GetString(0);
                var resourceId = resourceReader.GetString(1);

                switch (resourceType)
                {
                    case "cloudfront":
                        cloudFrontId = resourceId;
                        break;
                    case "s3":
                        s3Bucket = resourceId;
                        break;
                    case "route53":
                        route53Id = resourceId;
                        break;
                }
            }

            // Rebuild the account object with resource IDs
            var originalAccount = (dynamic)account;
            accounts[i] = new
            {
                id = (string)originalAccount.id,
                accountName = (string)originalAccount.accountName,
                accountId = (string)originalAccount.accountId,
                accessKeyId = (string)originalAccount.accessKeyId,
                secretAccessKey = (string)originalAccount.secretAccessKey,
                region = (string)originalAccount.region,
                isValidated = (bool)originalAccount.isValidated,
                createdAt = (string)originalAccount.createdAt,
                cloudFrontDistributionId = cloudFrontId,
                s3BucketName = s3Bucket,
                route53HealthCheckId = route53Id
            };
        }

        return accounts;
    }

    public async Task DeleteAccountAsync(int userId, string accountId)
    {
        var connectionString = await GetConnectionStringAsync();
        using var connection = new MySqlConnection(connectionString);
        await connection.OpenAsync();

        var query = "DELETE FROM aws_accounts WHERE id = @id AND user_id = @userId";
        using var cmd = new MySqlCommand(query, connection);
        cmd.Parameters.AddWithValue("@id", accountId);
        cmd.Parameters.AddWithValue("@userId", userId);

        await cmd.ExecuteNonQueryAsync();
    }
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
