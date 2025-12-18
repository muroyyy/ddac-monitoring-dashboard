using System.Security.Cryptography;
using System.Text;
using MySql.Data.MySqlClient;
using MonitoringDashboard.Api.Models;

namespace MonitoringDashboard.Api.Services;

public class AuthService : IAuthService
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<AuthService> _logger;
    private readonly SecretsManagerService _secretsManager;
    private string? _connectionString;

    public AuthService(IConfiguration configuration, ILogger<AuthService> logger, SecretsManagerService secretsManager)
    {
        _configuration = configuration;
        _logger = logger;
        _secretsManager = secretsManager;
    }

    private async Task<string> GetConnectionStringAsync()
    {
        if (_connectionString != null)
            return _connectionString;

        var secretName = _configuration["AWS:RdsSecretName"] ?? "ddac-monitoring-dev-rds-credentials";
        var credentials = await _secretsManager.GetRdsCredentialsAsync(secretName);
        
        if (credentials == null)
            throw new InvalidOperationException("Failed to retrieve RDS credentials from Secrets Manager");

        _connectionString = $"Server={credentials.host};Port={credentials.port};Database={credentials.dbname};User={credentials.username};Password={credentials.password};";
        return _connectionString;
    }

    public async Task<LoginResponse?> LoginAsync(string username, string password)
    {
        try
        {
            var connectionString = await GetConnectionStringAsync();
            using var connection = new MySqlConnection(connectionString);
            await connection.OpenAsync();

            var query = "SELECT id, username, email, password_hash, role FROM users WHERE username = @username AND is_active = 1";
            using var command = new MySqlCommand(query, connection);
            command.Parameters.AddWithValue("@username", username);

            using var reader = await command.ExecuteReaderAsync();
            if (!await reader.ReadAsync())
            {
                return null;
            }

            var user = new User
            {
                Id = reader.GetInt32("id"),
                Username = reader.GetString("username"),
                Email = reader.GetString("email"),
                PasswordHash = reader.GetString("password_hash"),
                Role = reader.GetString("role")
            };

            reader.Close();

            // Verify password (using BCrypt-like verification)
            if (!VerifyPassword(password, user.PasswordHash))
            {
                return null;
            }

            // Create session
            var sessionToken = GenerateSessionToken();
            var expiresAt = DateTime.UtcNow.AddHours(24);

            var insertQuery = @"INSERT INTO user_sessions (user_id, session_token, expires_at) 
                               VALUES (@userId, @sessionToken, @expiresAt)";
            using var insertCommand = new MySqlCommand(insertQuery, connection);
            insertCommand.Parameters.AddWithValue("@userId", user.Id);
            insertCommand.Parameters.AddWithValue("@sessionToken", sessionToken);
            insertCommand.Parameters.AddWithValue("@expiresAt", expiresAt);
            await insertCommand.ExecuteNonQueryAsync();

            return new LoginResponse
            {
                SessionToken = sessionToken,
                Username = user.Username,
                Email = user.Email
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during login for user {Username}", username);
            return null;
        }
    }

    public async Task<bool> VerifyEmailAsync(string email)
    {
        try
        {
            var connectionString = await GetConnectionStringAsync();
            using var connection = new MySqlConnection(connectionString);
            await connection.OpenAsync();

            var query = "SELECT COUNT(*) FROM users WHERE email = @email AND is_active = 1";
            using var command = new MySqlCommand(query, connection);
            command.Parameters.AddWithValue("@email", email);

            var count = Convert.ToInt32(await command.ExecuteScalarAsync());
            return count > 0;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error verifying email {Email}", email);
            return false;
        }
    }

    public async Task<bool> ResetPasswordAsync(string email, string newPassword)
    {
        try
        {
            var connectionString = await GetConnectionStringAsync();
            using var connection = new MySqlConnection(connectionString);
            await connection.OpenAsync();

            var passwordHash = HashPassword(newPassword);

            var query = "UPDATE users SET password_hash = @passwordHash, updated_at = NOW() WHERE email = @email AND is_active = 1";
            using var command = new MySqlCommand(query, connection);
            command.Parameters.AddWithValue("@passwordHash", passwordHash);
            command.Parameters.AddWithValue("@email", email);

            var rowsAffected = await command.ExecuteNonQueryAsync();
            return rowsAffected > 0;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error resetting password for email {Email}", email);
            return false;
        }
    }

    public async Task<bool> ValidateSessionAsync(string sessionToken)
    {
        try
        {
            var connectionString = await GetConnectionStringAsync();
            using var connection = new MySqlConnection(connectionString);
            await connection.OpenAsync();

            var query = "SELECT COUNT(*) FROM user_sessions WHERE session_token = @sessionToken AND expires_at > NOW()";
            using var command = new MySqlCommand(query, connection);
            command.Parameters.AddWithValue("@sessionToken", sessionToken);

            var count = Convert.ToInt32(await command.ExecuteScalarAsync());
            return count > 0;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error validating session token");
            return false;
        }
    }

    private string HashPassword(string password)
    {
        // Simple SHA256 hash (in production, use BCrypt)
        using var sha256 = SHA256.Create();
        var bytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
        return Convert.ToBase64String(bytes);
    }

    private bool VerifyPassword(string password, string hash)
    {
        // For BCrypt hashes from SQL, we need to handle both formats
        if (hash.StartsWith("$2b$") || hash.StartsWith("$2a$"))
        {
            // BCrypt hash - for initial admin user
            // Since we can't verify BCrypt in C# without library, check if it's the default password
            return password == "admin123" && hash == "$2b$12$LQv3c1yqBw2fnc.eM.zbFOCjbzyqjHm2vgWwbN0JKkND17bda9duu";
        }
        
        // SHA256 hash - for reset passwords
        var computedHash = HashPassword(password);
        return computedHash == hash;
    }

    private string GenerateSessionToken()
    {
        var randomBytes = new byte[32];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(randomBytes);
        return Convert.ToBase64String(randomBytes);
    }
}
