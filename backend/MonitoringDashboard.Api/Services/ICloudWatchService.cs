using Amazon.Runtime;
using MonitoringDashboard.Api.Models;

namespace MonitoringDashboard.Api.Services;

public interface ICloudWatchService
{
    Task<EC2Metrics> GetEC2MetricsAsync(string instanceId);
    Task<RDSMetrics> GetRDSMetricsAsync(string dbInstanceIdentifier);
    Task<LambdaMetrics> GetLambdaMetricsAsync(string functionName);
    Task<APIGatewayMetrics> GetAPIGatewayMetricsAsync(string apiId, string stage);
    Task<CloudFrontMetrics> GetCloudFrontMetricsAsync(string distributionId, BasicAWSCredentials credentials);
    Task<S3Metrics> GetS3MetricsAsync(string bucketName);
    Task<Route53Metrics> GetRoute53MetricsAsync(string healthCheckId, BasicAWSCredentials credentials);
}