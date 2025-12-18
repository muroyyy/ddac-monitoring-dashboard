# DDAC Monitoring Dashboard - Backend API

## Overview

ASP.NET Core Web API backend for AWS CloudWatch monitoring dashboard with cross-account observability support via CloudWatch OAM (Observability Access Manager).

## Architecture

```
Frontend (React) → Backend (ASP.NET Core) → AWS CloudWatch (via OAM) → Source Account (BloodLine)
```

## Key Features

- **Cross-Account Monitoring**: Uses CloudWatch OAM for accessing metrics from separate AWS accounts
- **Real-time Metrics**: EC2, RDS, Lambda, and API Gateway monitoring
- **Configuration Management**: Admin settings stored in SSM Parameter Store
- **Health Assessment**: Threshold-based health status determination
- **IAM Role Security**: No hardcoded credentials, uses EC2 instance roles

## API Endpoints

### Metrics
- `GET /api/metrics/ec2` - EC2 instance metrics
- `GET /api/metrics/rds` - RDS database metrics  
- `GET /api/metrics/lambda?functionName={name}` - Lambda function metrics
- `GET /api/metrics/apigateway` - API Gateway metrics
- `GET /api/metrics/all` - All metrics in single response

### Settings
- `GET /api/settings` - Get monitoring configuration
- `POST /api/settings` - Save monitoring configuration
- `GET /api/settings/validate` - Validate current settings

### Health
- `GET /api/health/status` - System health status
- `GET /api/health/deployment` - Deployment information
- `GET /api/health` - Overall health summary
- `GET /api/health/ping` - Simple health check

## CloudWatch OAM Setup

### Monitoring Account (This Backend)
1. Create OAM Sink:
```bash
aws oam create-sink --name "monitoring-sink" --tags Key=Project,Value=DDAC
```

2. Create OAM Link (replace SOURCE_ACCOUNT_ID):
```bash
aws oam create-link \
  --sink-identifier "arn:aws:oam:ap-southeast-1:MONITORING_ACCOUNT:sink/SINK_ID" \
  --resource-types "AWS::CloudWatch::Metric" "AWS::Logs::LogGroup" \
  --label-template "BloodLine-$AccountName"
```

### Source Account (BloodLine Application)
1. Accept the OAM link invitation
2. Configure resource sharing for CloudWatch metrics

## IAM Permissions

The EC2 instance running this backend needs the following IAM policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "cloudwatch:GetMetricStatistics",
        "cloudwatch:ListMetrics",
        "oam:ListSinks",
        "oam:ListLinks"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "ssm:GetParameter",
        "ssm:PutParameter"
      ],
      "Resource": "arn:aws:ssm:*:*:parameter/monitoring-dashboard/*"
    }
  ]
}
```

## Configuration

Settings are stored in SSM Parameter Store at `/monitoring-dashboard/settings`:

```json
{
  "aws": {
    "region": "ap-southeast-1",
    "environment": "prod",
    "sourceAccountId": "123456789012"
  },
  "ec2": {
    "instanceId": "i-1234567890abcdef0",
    "enableDetailedMonitoring": true,
    "refreshInterval": 30
  },
  "rds": {
    "dbInstanceIdentifier": "bloodline-db",
    "enablePerformanceInsights": true
  },
  "serverless": {
    "lambdaFunctionNames": ["bloodline-api", "bloodline-processor"],
    "apiGatewayId": "abc123def4",
    "apiGatewayStage": "prod"
  },
  "thresholds": {
    "cpuWarning": 70.0,
    "cpuCritical": 90.0,
    "memoryWarning": 80.0,
    "memoryCritical": 95.0,
    "errorRateWarning": 5.0,
    "errorRateCritical": 10.0
  }
}
```

## Development

### Prerequisites
- .NET 8 SDK
- AWS CLI configured with appropriate permissions
- Docker (for containerized deployment)

### Local Development
```bash
cd MonitoringDashboard.Api
dotnet restore
dotnet run
```

### Docker Build
```bash
docker build -t ddac-monitoring-backend .
docker run -p 8080:8080 ddac-monitoring-backend
```

## Deployment

### EC2 Deployment
1. Launch EC2 instance with IAM role
2. Install Docker
3. Deploy container with SSM Port Forwarding access
4. Configure CloudWatch OAM links

### Access via SSM
```bash
aws ssm start-session --target i-1234567890abcdef0 --document-name AWS-StartPortForwardingSession --parameters '{"portNumber":["8080"],"localPortNumber":["8080"]}'
```

## Monitoring Metrics

### EC2 Metrics
- **CPUUtilization**: Average CPU usage percentage
- **MemoryUtilization**: Memory usage (requires CloudWatch Agent)
- **DiskUtilization**: Disk usage percentage
- **NetworkIn/Out**: Network traffic in bytes

### RDS Metrics  
- **CPUUtilization**: Database CPU usage
- **FreeableMemory**: Available memory in bytes
- **DatabaseConnections**: Active connections count
- **ReadIOPS/WriteIOPS**: I/O operations per second

### Lambda Metrics
- **Invocations**: Function invocation count
- **Errors**: Error count
- **Duration**: Average execution time
- **Throttles**: Throttled invocation count

### API Gateway Metrics
- **Count**: Total request count
- **Latency**: Average response time
- **4XXError/5XXError**: Client/server error counts

## Security Considerations

- No AWS credentials in code or configuration
- Uses IAM instance roles exclusively
- SSM Parameter Store for secure configuration storage
- CORS configured for frontend origins only
- Non-root container user for Docker deployment