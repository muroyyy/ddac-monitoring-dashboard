namespace MonitoringDashboard.Api.Models;

public class MetricDataPoint
{
    public string Timestamp { get; set; } = string.Empty;
    public double Value { get; set; }
}

public class EC2Metrics
{
    public double CpuUtilization { get; set; }
    public double MemoryUtilization { get; set; }
    public double DiskUsage { get; set; }
    public double NetworkIn { get; set; }
    public double NetworkOut { get; set; }
    public List<MetricDataPoint> CpuHistory { get; set; } = new();
    public List<MetricDataPoint> MemoryHistory { get; set; } = new();
    public List<MetricDataPoint> DiskHistory { get; set; } = new();
}

public class RDSMetrics
{
    public double CpuUtilization { get; set; }
    public double FreeableMemory { get; set; }
    public int DatabaseConnections { get; set; }
    public double ReadIOPS { get; set; }
    public double WriteIOPS { get; set; }
    public List<MetricDataPoint> CpuHistory { get; set; } = new();
    public List<MetricDataPoint> ConnectionsHistory { get; set; } = new();
}

public class LambdaMetrics
{
    public int Invocations { get; set; }
    public int Errors { get; set; }
    public double Duration { get; set; }
    public int Throttles { get; set; }
    public List<MetricDataPoint> InvocationsHistory { get; set; } = new();
    public List<MetricDataPoint> ErrorsHistory { get; set; } = new();
}

public class APIGatewayMetrics
{
    public int RequestCount { get; set; }
    public double Latency { get; set; }
    public int Count4xx { get; set; }
    public int Count5xx { get; set; }
    public List<MetricDataPoint> RequestHistory { get; set; } = new();
}

public class HealthStatus
{
    public string Backend { get; set; } = "healthy";
    public string Database { get; set; } = "healthy";
    public string Lambda { get; set; } = "healthy";
    public string Cdn { get; set; } = "healthy";
    public int Http2xx { get; set; }
    public int Http4xx { get; set; }
    public int Http5xx { get; set; }
}

public class DeploymentInfo
{
    public string LastDeployment { get; set; } = string.Empty;
    public string BuildId { get; set; } = string.Empty;
    public string Branch { get; set; } = string.Empty;
    public string Status { get; set; } = "success";
}