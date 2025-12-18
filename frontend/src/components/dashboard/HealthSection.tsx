import { Activity, Server, Database, Zap, Globe } from 'lucide-react';
import { StatusIndicator } from './StatusIndicator';
import { HealthStatus } from '@/types/metrics';

interface HealthSectionProps {
  healthStatus: HealthStatus;
}

export const HealthSection = ({ healthStatus }: HealthSectionProps) => {
  const total = healthStatus.http2xx + healthStatus.http4xx + healthStatus.http5xx;
  const successRate = ((healthStatus.http2xx / total) * 100).toFixed(1);

  return (
    <section className="space-y-4">
      <div className="section-header">
        <Activity className="h-5 w-5 text-metric-health" />
        <span>System Health Overview</span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatusIndicator
          status={healthStatus.backend}
          label="Backend API (EC2)"
        />
        <StatusIndicator
          status={healthStatus.database}
          label="Database (RDS)"
        />
        <StatusIndicator
          status={healthStatus.lambda}
          label="Lambda Functions"
        />
        <StatusIndicator
          status={healthStatus.cdn}
          label="CDN (CloudFront)"
        />
      </div>

      <div className="rounded-lg border border-border bg-card p-6">
        <h3 className="mb-4 text-sm font-medium text-muted-foreground">
          HTTP Response Distribution
        </h3>
        <div className="grid gap-6 lg:grid-cols-4">
          <div className="lg:col-span-1">
            <div className="text-center">
              <p className="font-mono text-4xl font-bold text-metric-success">
                {successRate}%
              </p>
              <p className="mt-1 text-sm text-muted-foreground">Success Rate</p>
            </div>
          </div>
          <div className="lg:col-span-3">
            <div className="flex h-8 overflow-hidden rounded-lg">
              <div
                className="bg-metric-success transition-all duration-500"
                style={{ width: `${(healthStatus.http2xx / total) * 100}%` }}
              />
              <div
                className="bg-metric-warning transition-all duration-500"
                style={{ width: `${(healthStatus.http4xx / total) * 100}%` }}
              />
              <div
                className="bg-metric-error transition-all duration-500"
                style={{ width: `${(healthStatus.http5xx / total) * 100}%` }}
              />
            </div>
            <div className="mt-4 flex justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded bg-metric-success" />
                <span className="text-muted-foreground">
                  2xx: {healthStatus.http2xx.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded bg-metric-warning" />
                <span className="text-muted-foreground">
                  4xx: {healthStatus.http4xx.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded bg-metric-error" />
                <span className="text-muted-foreground">
                  5xx: {healthStatus.http5xx.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
