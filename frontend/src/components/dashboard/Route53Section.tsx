import { Globe, Activity, Clock, MapPin, Network, Shield } from 'lucide-react';
import { MetricCard } from './MetricCard';
import { MetricChart } from './MetricChart';
import { Route53Metrics, DnsQueryLog } from '@/types/metrics';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Route53SectionProps {
  metrics: Route53Metrics;
}

const formatTimestamp = (timestamp: string): string => {
  try {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  } catch {
    return timestamp;
  }
};

const getResponseCodeColor = (code: string): string => {
  if (code === 'NOERROR') return 'bg-green-100 text-green-800';
  if (code === 'NXDOMAIN') return 'bg-yellow-100 text-yellow-800';
  if (code === 'SERVFAIL') return 'bg-red-100 text-red-800';
  return 'bg-gray-100 text-gray-800';
};

const QueryLogTable = ({ queries }: { queries: DnsQueryLog[] }) => {
  if (!queries || queries.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No recent DNS queries found
      </div>
    );
  }

  return (
    <ScrollArea className="h-64">
      <div className="space-y-2">
        {queries.map((query, index) => (
          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg text-sm">
            <div className="flex items-center space-x-4 flex-1">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-gray-400" />
                <span className="font-mono text-xs">{formatTimestamp(query.timestamp)}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Network className="h-4 w-4 text-blue-500" />
                <span className="font-mono">{query.sourceIp}</span>
              </div>
              <div className="flex-1">
                <div className="font-medium">{query.queryName}</div>
                <div className="text-xs text-gray-500">{query.queryType}</div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge className={getResponseCodeColor(query.responseCode)}>
                {query.responseCode}
              </Badge>
              <div className="flex items-center space-x-1 text-xs text-gray-500">
                <MapPin className="h-3 w-3" />
                <span>{query.edgeLocation}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
};

export const Route53Section = ({ metrics }: Route53SectionProps) => {
  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

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
          title="Recent Queries"
          value={metrics.recentQueries?.length.toString() || '0'}
          unit="logs"
          trend="stable"
          trendValue="Last 30 min"
          icon={<Shield className="h-4 w-4" />}
          variant="route53"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <MetricChart
          data={metrics.dnsQueriesHistory || []}
          title="DNS Queries Over Time"
          color="hsl(280 70% 55%)"
          unit="queries"
        />
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-[hsl(280,70%,55%)]" />
              <span>Recent DNS Query Logs</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <QueryLogTable queries={metrics.recentQueries || []} />
          </CardContent>
        </Card>
      </div>
    </section>
  );
};
