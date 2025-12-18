import { useState, useEffect, useCallback } from 'react';
import { EC2Metrics, RDSMetrics, LambdaMetrics, APIGatewayMetrics, HealthStatus, DeploymentInfo, MetricDataPoint } from '@/types/metrics';

const generateHistoryData = (baseValue: number, variance: number, points: number = 24): MetricDataPoint[] => {
  const now = new Date();
  return Array.from({ length: points }, (_, i) => {
    const timestamp = new Date(now.getTime() - (points - 1 - i) * 5 * 60 * 1000);
    return {
      timestamp: timestamp.toISOString(),
      value: Math.max(0, baseValue + (Math.random() - 0.5) * variance),
    };
  });
};

const generateMockEC2Metrics = (): EC2Metrics => ({
  cpuUtilization: 35 + Math.random() * 25,
  memoryUtilization: 55 + Math.random() * 20,
  diskUsage: 42 + Math.random() * 10,
  networkIn: 150 + Math.random() * 100,
  networkOut: 80 + Math.random() * 60,
  cpuHistory: generateHistoryData(40, 30),
  memoryHistory: generateHistoryData(60, 20),
});

const generateMockRDSMetrics = (): RDSMetrics => ({
  cpuUtilization: 20 + Math.random() * 15,
  freeableMemory: 3.5 + Math.random() * 1,
  databaseConnections: 15 + Math.floor(Math.random() * 10),
  readIOPS: 200 + Math.random() * 150,
  writeIOPS: 80 + Math.random() * 60,
  cpuHistory: generateHistoryData(25, 15),
  connectionsHistory: generateHistoryData(18, 8),
});

const generateMockLambdaMetrics = (): LambdaMetrics => ({
  invocations: 1200 + Math.floor(Math.random() * 500),
  errors: Math.floor(Math.random() * 5),
  duration: 120 + Math.random() * 80,
  throttles: Math.floor(Math.random() * 2),
  invocationsHistory: generateHistoryData(1400, 600),
  errorsHistory: generateHistoryData(2, 4),
});

const generateMockAPIGatewayMetrics = (): APIGatewayMetrics => ({
  requestCount: 5000 + Math.floor(Math.random() * 2000),
  latency: 45 + Math.random() * 30,
  count4xx: 12 + Math.floor(Math.random() * 10),
  count5xx: Math.floor(Math.random() * 3),
  requestHistory: generateHistoryData(5500, 2000),
});

const generateMockHealthStatus = (): HealthStatus => ({
  backend: Math.random() > 0.1 ? 'healthy' : 'warning',
  database: Math.random() > 0.05 ? 'healthy' : 'warning',
  lambda: Math.random() > 0.1 ? 'healthy' : 'warning',
  cdn: 'healthy',
  http2xx: 4850 + Math.floor(Math.random() * 200),
  http4xx: 45 + Math.floor(Math.random() * 20),
  http5xx: Math.floor(Math.random() * 5),
});

const generateMockDeploymentInfo = (): DeploymentInfo => ({
  lastDeployment: new Date(Date.now() - Math.random() * 3600000 * 4).toISOString(),
  buildId: `build-${Math.random().toString(36).substring(2, 9)}`,
  branch: 'dev',
  status: 'success',
});

export const useMetrics = (refreshInterval: number = 30000) => {
  const [ec2Metrics, setEC2Metrics] = useState<EC2Metrics>(generateMockEC2Metrics());
  const [rdsMetrics, setRDSMetrics] = useState<RDSMetrics>(generateMockRDSMetrics());
  const [lambdaMetrics, setLambdaMetrics] = useState<LambdaMetrics>(generateMockLambdaMetrics());
  const [apiGatewayMetrics, setAPIGatewayMetrics] = useState<APIGatewayMetrics>(generateMockAPIGatewayMetrics());
  const [healthStatus, setHealthStatus] = useState<HealthStatus>(generateMockHealthStatus());
  const [deploymentInfo, setDeploymentInfo] = useState<DeploymentInfo>(generateMockDeploymentInfo());
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshMetrics = useCallback(async () => {
    setIsRefreshing(true);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setEC2Metrics(generateMockEC2Metrics());
    setRDSMetrics(generateMockRDSMetrics());
    setLambdaMetrics(generateMockLambdaMetrics());
    setAPIGatewayMetrics(generateMockAPIGatewayMetrics());
    setHealthStatus(generateMockHealthStatus());
    setDeploymentInfo(generateMockDeploymentInfo());
    setLastUpdated(new Date());
    setIsRefreshing(false);
  }, []);

  useEffect(() => {
    const interval = setInterval(refreshMetrics, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval, refreshMetrics]);

  return {
    ec2Metrics,
    rdsMetrics,
    lambdaMetrics,
    apiGatewayMetrics,
    healthStatus,
    deploymentInfo,
    lastUpdated,
    isRefreshing,
    refreshMetrics,
  };
};
