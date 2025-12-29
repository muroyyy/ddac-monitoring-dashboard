import { Globe, Heart, CheckCircle, XCircle } from 'lucide-react';
import { MetricCard } from './MetricCard';
import { MetricChart } from './MetricChart';
import { Route53Metrics } from '@/types/metrics';

interface Route53SectionProps {
  metrics: Route53Metrics;
}

export const Route53Section = ({ metrics }: Route53SectionProps) => {
  const isHealthy = metrics.healthCheckStatus === 1;

  return (
    <section className="space-y-4">
      <div className="section-header">
        <Globe className="h-5 w-5 text-metric-route53" />
        <span>Route53 DNS Health{metrics.healthCheckId ? ` - ${metrics.healthCheckId}` : ''}</span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCard
          title="Health Check Status"
          value={isHealthy ? 'Healthy' : 'Unhealthy'}
          unit=""
          trend={isHealthy ? 'up' : 'down'}
          trendValue={isHealthy ? 'All checks passing' : 'Check failing'}
          icon={isHealthy ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
          variant="route53"
        />
        <MetricCard
          title="Healthy Endpoints"
          value={metrics.healthCheckPercentageHealthy}
          unit="%"
          trend={metrics.healthCheckPercentageHealthy >= 100 ? 'up' : 'down'}
          trendValue={metrics.healthCheckPercentageHealthy >= 100 ? 'All healthy' : 'Some unhealthy'}
          icon={<Heart className="h-4 w-4" />}
          variant="route53"
        />
        <MetricCard
          title="Health Check ID"
          value={metrics.healthCheckId || 'N/A'}
          unit=""
          trend="stable"
          trendValue="Configured"
          icon={<Globe className="h-4 w-4" />}
          variant="route53"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-1">
        <MetricChart
          data={metrics.healthStatusHistory || []}
          title="Health Check Status Over Time"
          color="hsl(280 70% 55%)"
          unit=""
        />
      </div>
    </section>
  );
};
