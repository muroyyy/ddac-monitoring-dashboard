export interface MetricDataPoint {
  timestamp: string;
  value: number;
}

export interface EC2Metrics {
  resourceName?: string;
  cpuUtilization: number;
  memoryUtilization: number;
  diskUsage: number;
  networkIn: number;
  networkOut: number;
  cpuHistory: MetricDataPoint[];
  memoryHistory: MetricDataPoint[];
  diskHistory?: MetricDataPoint[];
}

export interface RDSMetrics {
  resourceName?: string;
  cpuUtilization: number;
  freeableMemory: number;
  databaseConnections: number;
  readIOPS: number;
  writeIOPS: number;
  cpuHistory: MetricDataPoint[];
  connectionsHistory: MetricDataPoint[];
}

export interface LambdaMetrics {
  resourceName?: string;
  invocations: number;
  errors: number;
  duration: number;
  throttles: number;
  invocationsHistory: MetricDataPoint[];
  errorsHistory: MetricDataPoint[];
}

export interface APIGatewayMetrics {
  resourceName?: string;
  requestCount: number;
  latency: number;
  count4xx: number;
  count5xx: number;
  requestHistory: MetricDataPoint[];
}

export interface HealthStatus {
  backend: 'healthy' | 'warning' | 'error';
  database: 'healthy' | 'warning' | 'error';
  lambda: 'healthy' | 'warning' | 'error';
  cdn: 'healthy' | 'warning' | 'error';
  http2xx: number;
  http4xx: number;
  http5xx: number;
}

export interface DeploymentInfo {
  lastDeployment: string;
  buildId: string;
  branch: string;
  status: 'success' | 'failed' | 'running';
}
