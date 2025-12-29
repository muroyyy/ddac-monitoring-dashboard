import { HardDrive, FileStack, Database, Activity, AlertTriangle } from 'lucide-react';
import { MetricCard } from './MetricCard';
import { MetricChart } from './MetricChart';
import { S3Metrics } from '@/types/metrics';

interface S3SectionProps {
  metrics: S3Metrics;
}

const formatBytes = (bytes: number): { value: number; unit: string } => {
  if (bytes >= 1073741824) return { value: bytes / 1073741824, unit: 'GB' };
  if (bytes >= 1048576) return { value: bytes / 1048576, unit: 'MB' };
  if (bytes >= 1024) return { value: bytes / 1024, unit: 'KB' };
  return { value: bytes, unit: 'B' };
};

export const S3Section = ({ metrics }: S3SectionProps) => {
  const size = formatBytes(metrics.bucketSizeBytes);

  return (
    <section className="space-y-4">
      <div className="section-header">
        <HardDrive className="h-5 w-5 text-metric-s3" />
        <span>S3 Storage{metrics.bucketName ? ` - ${metrics.bucketName}` : ''}</span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <MetricCard
          title="Bucket Size"
          value={size.value}
          unit={size.unit}
          trend="stable"
          trendValue="Normal"
          icon={<Database className="h-4 w-4" />}
          variant="s3"
        />
        <MetricCard
          title="Object Count"
          value={metrics.numberOfObjects.toLocaleString()}
          unit="files"
          trend="stable"
          trendValue="Normal"
          icon={<FileStack className="h-4 w-4" />}
          variant="s3"
        />
        <MetricCard
          title="All Requests"
          value={metrics.allRequests.toLocaleString()}
          unit=""
          trend="stable"
          trendValue="Normal"
          icon={<Activity className="h-4 w-4" />}
          variant="s3"
        />
        <MetricCard
          title="4xx Errors"
          value={metrics.error4xxCount}
          unit=""
          trend={metrics.error4xxCount > 10 ? 'up' : 'stable'}
          trendValue={metrics.error4xxCount > 10 ? 'High' : 'Normal'}
          icon={<AlertTriangle className="h-4 w-4" />}
          variant="s3"
        />
        <MetricCard
          title="5xx Errors"
          value={metrics.error5xxCount}
          unit=""
          trend={metrics.error5xxCount > 0 ? 'up' : 'stable'}
          trendValue={metrics.error5xxCount > 0 ? 'Check' : 'Normal'}
          icon={<AlertTriangle className="h-4 w-4" />}
          variant="s3"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <MetricChart
          data={metrics.requestsHistory || []}
          title="S3 Requests Over Time"
          color="hsl(35 95% 55%)"
          unit=""
        />
        <MetricChart
          data={metrics.bucketSizeHistory || []}
          title="Bucket Size Over Time"
          color="hsl(35 95% 55%)"
          unit="bytes"
        />
      </div>
    </section>
  );
};
