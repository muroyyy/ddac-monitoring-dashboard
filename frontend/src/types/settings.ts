export interface AWSEnvironmentSettings {
  region: string;
  environment: 'dev' | 'staging' | 'production';
}

export interface AWSAccountConfig {
  id: string;
  accountName: string;
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
  isValidated: boolean;
  createdAt: string;
  cloudFrontDistributionId?: string;
  s3BucketName?: string;
  route53HealthCheckId?: string;
}

export interface EC2Settings {
  instanceId: string;
  instanceName: string;
  instanceType: string;
  state: 'running' | 'stopped' | 'pending';
  enabled: boolean;
}

export interface RDSSettings {
  instanceIdentifier: string;
  engine: string;
  instanceClass: string;
  enabled: boolean;
}

export interface LambdaFunctionSettings {
  functionName: string;
  runtime: string;
  enabled: boolean;
}

export interface ServerlessSettings {
  lambdaFunctions: LambdaFunctionSettings[];
  apiGatewayStage: string;
  enabled: boolean;
}

export interface ThresholdSettings {
  cpuWarningLevel: number;
  memoryWarningLevel: number;
  errorRateThreshold: number;
  refreshInterval: 30 | 60 | 120;
}

export interface MonitoringSettings {
  aws: AWSEnvironmentSettings;
  ec2: EC2Settings;
  rds: RDSSettings;
  serverless: ServerlessSettings;
  thresholds: ThresholdSettings;
  updatedAt: string;
  updatedBy: string;
}

export const AWS_REGIONS = [
  { value: 'ap-southeast-1', label: 'Asia Pacific (Singapore)' },
  { value: 'ap-southeast-2', label: 'Asia Pacific (Sydney)' },
  { value: 'ap-northeast-1', label: 'Asia Pacific (Tokyo)' },
  { value: 'us-east-1', label: 'US East (N. Virginia)' },
  { value: 'us-west-2', label: 'US West (Oregon)' },
  { value: 'eu-west-1', label: 'Europe (Ireland)' },
  { value: 'eu-central-1', label: 'Europe (Frankfurt)' },
];

export const MOCK_EC2_INSTANCES = [
  { instanceId: 'i-0abc123def456', instanceName: 'bloodline-api-prod', instanceType: 't3.medium', state: 'running' as const },
  { instanceId: 'i-0def456abc789', instanceName: 'bloodline-api-staging', instanceType: 't3.small', state: 'running' as const },
  { instanceId: 'i-0ghi789jkl012', instanceName: 'bloodline-worker', instanceType: 't3.micro', state: 'stopped' as const },
];

export const MOCK_RDS_INSTANCES = [
  { instanceIdentifier: 'bloodline-db-prod', engine: 'MySQL 8.0', instanceClass: 'db.t3.medium' },
  { instanceIdentifier: 'bloodline-db-staging', engine: 'MySQL 8.0', instanceClass: 'db.t3.small' },
];

export const MOCK_LAMBDA_FUNCTIONS = [
  { functionName: 'bloodline-auth-handler', runtime: 'nodejs18.x' },
  { functionName: 'bloodline-email-sender', runtime: 'nodejs18.x' },
  { functionName: 'bloodline-image-processor', runtime: 'python3.9' },
];

export const DEFAULT_SETTINGS: MonitoringSettings = {
  aws: {
    region: 'ap-southeast-1',
    environment: 'production',
  },
  ec2: {
    instanceId: 'i-0abc123def456',
    instanceName: 'bloodline-api-prod',
    instanceType: 't3.medium',
    state: 'running',
    enabled: true,
  },
  rds: {
    instanceIdentifier: 'bloodline-db-prod',
    engine: 'MySQL 8.0',
    instanceClass: 'db.t3.medium',
    enabled: true,
  },
  serverless: {
    lambdaFunctions: [
      { functionName: 'bloodline-auth-handler', runtime: 'nodejs18.x', enabled: true },
      { functionName: 'bloodline-email-sender', runtime: 'nodejs18.x', enabled: true },
    ],
    apiGatewayStage: 'prod',
    enabled: true,
  },
  thresholds: {
    cpuWarningLevel: 70,
    memoryWarningLevel: 80,
    errorRateThreshold: 5,
    refreshInterval: 30,
  },
  updatedAt: new Date().toISOString(),
  updatedBy: 'admin@bloodline.dev',
};
