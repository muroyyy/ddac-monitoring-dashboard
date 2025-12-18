namespace MonitoringDashboard.Api.Models;

public class MonitoringSettings
{
    public AWSSettings Aws { get; set; } = new();
    public EC2Settings Ec2 { get; set; } = new();
    public RDSSettings Rds { get; set; } = new();
    public ServerlessSettings Serverless { get; set; } = new();
    public ThresholdSettings Thresholds { get; set; } = new();
    public string? UpdatedAt { get; set; }
}

public class AWSSettings
{
    public string Region { get; set; } = "ap-southeast-1";
    public string Environment { get; set; } = "dev";
    public string SourceAccountId { get; set; } = string.Empty;
}

public class EC2Settings
{
    public string InstanceId { get; set; } = string.Empty;
    public bool EnableDetailedMonitoring { get; set; } = true;
    public int RefreshInterval { get; set; } = 30;
}

public class RDSSettings
{
    public string DbInstanceIdentifier { get; set; } = string.Empty;
    public bool EnablePerformanceInsights { get; set; } = true;
}

public class ServerlessSettings
{
    public List<string> LambdaFunctionNames { get; set; } = new();
    public string ApiGatewayId { get; set; } = string.Empty;
    public string ApiGatewayStage { get; set; } = "prod";
}

public class ThresholdSettings
{
    public double CpuWarning { get; set; } = 70.0;
    public double CpuCritical { get; set; } = 90.0;
    public double MemoryWarning { get; set; } = 80.0;
    public double MemoryCritical { get; set; } = 95.0;
    public double ErrorRateWarning { get; set; } = 5.0;
    public double ErrorRateCritical { get; set; } = 10.0;
}