import { Cloud, Activity, Gauge, AlertTriangle, Clock } from 'lucide-react';
import { MetricCard } from './MetricCard';
import { MetricChart } from './MetricChart';
import { CloudFrontMetrics } from '@/types/metrics';

interface CloudFrontSectionProps {
  metrics: CloudFrontMetrics;
}

export const CloudFrontSection = ({ metrics }: CloudFrontSectionProps) => {
  return (
    <section className="space-y-4">
      <div className="section-header">
        <Cloud className="h-5 w-5 text-metric-cloudfront" />
        <span>CloudFront CDN{metrics.domainName ? ` - ${metrics.domainName}` : ''}</span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <MetricCard
          title="Total Requests"
          value={metrics.requests.toLocaleString()}
          unit=""
          trend="stable"
          trendValue="Normal"
          icon={<Activity className="h-4 w-4" />}
          variant="cloudfront"
        />
        <MetricCard
          title="Cache Hit Rate"
          value={metrics.cacheHitRate}
          unit="%"
          trend={metrics.cacheHitRate > 80 ? 'up' : 'down'}
          trendValue={metrics.cacheHitRate > 80 ? 'Good' : 'Review'}
          icon={<Gauge className="h-4 w-4" />}
          variant="cloudfront"
        />
        <MetricCard
          title="4xx Error Rate"
          value={metrics.error4xxRate}
          unit="%"
          trend={metrics.error4xxRate > 5 ? 'up' : 'stable'}
          trendValue={metrics.error4xxRate > 5 ? 'High' : 'Normal'}
          icon={<AlertTriangle className="h-4 w-4" />}
          variant="cloudfront"
        />
        <MetricCard
          title="5xx Error Rate"
          value={metrics.error5xxRate}
          unit="%"
          trend={metrics.error5xxRate > 1 ? 'up' : 'stable'}
          trendValue={metrics.error5xxRate > 1 ? 'High' : 'Normal'}
          icon={<AlertTriangle className="h-4 w-4" />}
          variant="cloudfront"
        />
        <MetricCard
          title="Origin Latency"
          value={metrics.originLatency}
          unit="ms"
          trend={metrics.originLatency > 500 ? 'up' : 'stable'}
          trendValue={metrics.originLatency > 500 ? 'Slow' : 'Fast'}
          icon={<Clock className="h-4 w-4" />}
          variant="cloudfront"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <MetricChart
          data={metrics.requestsHistory || []}
          title="Requests Over Time"
          color="hsl(200 85% 55%)"
          unit=""
        />
        <MetricChart
          data={metrics.cacheHitRateHistory || []}
          title="Cache Hit Rate Over Time"
          color="hsl(200 85% 55%)"
          unit="%"
        />
      </div>
    </section>
  );
};
