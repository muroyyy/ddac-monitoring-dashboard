import { Globe, Activity } from 'lucide-react';
import { MetricCard } from './MetricCard';
import { MetricChart } from './MetricChart';
import { Route53Metrics } from '@/types/metrics';

interface Route53SectionProps {
  metrics: Route53Metrics;
}

const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
};

export const Route53Section = ({ metrics }: Route53SectionProps) => {
  return (
    <section className="space-y-4">
      <div className="section-header">
        <Globe className="h-5 w-5 text-[hsl(280,70%,55%)]" />
        <span>Route53 DNS{metrics.hostedZoneName ? ` - ${metrics.hostedZoneName}` : ''}</span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCard
          title="DNS Queries"
          value={formatNumber(metrics.dnsQueries)}
          unit="queries"
          trend="stable"
          trendValue="Last 30 min"
          icon={<Activity className="h-4 w-4" />}
          variant="route53"
        />
        <MetricCard
          title="Hosted Zone"
          value={metrics.hostedZoneName || 'N/A'}
          unit=""
          trend="stable"
          trendValue="Active"
          icon={<Globe className="h-4 w-4" />}
          variant="route53"
        />
        <MetricCard
          title="Zone ID"
          value={metrics.hostedZoneId || 'N/A'}
          unit=""
          trend="stable"
          trendValue="Configured"
          icon={<Globe className="h-4 w-4" />}
          variant="route53"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-1">
        <MetricChart
          data={metrics.dnsQueriesHistory || []}
          title="DNS Queries Over Time"
          color="hsl(280 70% 55%)"
          unit="queries"
        />
      </div>
    </section>
  );
};
