import { useState, useEffect, useCallback } from 'react';
import { EC2Metrics, RDSMetrics, LambdaMetrics, APIGatewayMetrics, HealthStatus, DeploymentInfo } from '@/types/metrics';
import { AWSAccountConfig } from '@/types/settings';

export const useMetrics = (selectedAccount: AWSAccountConfig | null, refreshInterval: number = 30000) => {
  const [ec2Metrics, setEC2Metrics] = useState<EC2Metrics | null>(null);
  const [rdsMetrics, setRDSMetrics] = useState<RDSMetrics | null>(null);
  const [lambdaMetrics, setLambdaMetrics] = useState<LambdaMetrics | null>(null);
  const [apiGatewayMetrics, setAPIGatewayMetrics] = useState<APIGatewayMetrics | null>(null);
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null);
  const [deploymentInfo, setDeploymentInfo] = useState<DeploymentInfo>({
    branch: 'main',
    buildId: 'N/A',
    lastDeployment: new Date().toISOString(),
    status: 'success',
  });
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshMetrics = useCallback(async () => {
    if (!selectedAccount) return;

    setIsRefreshing(true);
    setError(null);
    
    try {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const sessionToken = localStorage.getItem('sessionToken');
      
      // Fetch metrics from backend with account credentials
      const response = await fetch(`${apiUrl}/api/metrics`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`
        },
        body: JSON.stringify({
          accountId: selectedAccount.id,
          accessKeyId: selectedAccount.accessKeyId,
          secretAccessKey: selectedAccount.secretAccessKey,
          region: selectedAccount.region
        })
      });

      if (!response.ok) {
        throw new Error('Failed to fetch metrics');
      }

      const data = await response.json();
      
      setEC2Metrics(data.ec2Metrics);
      setRDSMetrics(data.rdsMetrics);
      setLambdaMetrics(data.lambdaMetrics);
      setAPIGatewayMetrics(data.apiGatewayMetrics);
      setHealthStatus(data.healthStatus);
      setDeploymentInfo(data.deploymentInfo);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch metrics');
      console.error('Error fetching metrics:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, [selectedAccount]);

  useEffect(() => {
    if (selectedAccount) {
      refreshMetrics();
      const interval = setInterval(refreshMetrics, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [selectedAccount, refreshInterval, refreshMetrics]);

  return {
    ec2Metrics,
    rdsMetrics,
    lambdaMetrics,
    apiGatewayMetrics,
    healthStatus,
    deploymentInfo,
    lastUpdated,
    isRefreshing,
    error,
    refreshMetrics,
  };
};
