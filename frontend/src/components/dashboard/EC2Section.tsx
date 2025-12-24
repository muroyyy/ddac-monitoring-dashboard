import { Server, Cpu, HardDrive, Network, MemoryStick } from 'lucide-react';
import { MetricCard } from './MetricCard';
import { MetricChart } from './MetricChart';
import { EC2Metrics } from '@/types/metrics';

interface EC2SectionProps {
  metrics: EC2Metrics;
}

export const EC2Section = ({ metrics }: EC2SectionProps) => {
  return (
    <section className="space-y-4">
      <div className="section-header">
        <Server className="h-5 w-5 text-metric-ec2" />
        <span>EC2 Application Server{metrics.resourceName ? ` - ${metrics.resourceName}` : ''}</span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <MetricCard
          title="CPU Utilization"
          value={metrics.cpuUtilization}
          unit="%"
          trend={metrics.cpuUtilization > 70 ? 'up' : 'stable'}
          trendValue={metrics.cpuUtilization > 70 ? 'High load' : 'Normal'}
          icon={<Cpu className="h-4 w-4" />}
          variant="ec2"
        />
        <MetricCard
          title="Memory Usage"
          value={metrics.memoryUtilization}
          unit="%"
          trend="stable"
          trendValue="Stable"
          icon={<MemoryStick className="h-4 w-4" />}
          variant="ec2"
        />
        <MetricCard
          title="Disk Usage"
          value={metrics.diskUsage}
          unit="%"
          trend="stable"
          trendValue="Healthy"
          icon={<HardDrive className="h-4 w-4" />}
          variant="ec2"
        />
        <MetricCard
          title="Disk Size"
          value={metrics.diskSize}
          unit="GB"
          trend="stable"
          trendValue="Used"
          icon={<HardDrive className="h-4 w-4" />}
          variant="ec2"
        />
        <MetricCard
          title="Network In"
          value={metrics.networkIn}
          unit="MB/s"
          trend="up"
          trendValue="+12%"
          icon={<Network className="h-4 w-4" />}
          variant="ec2"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <MetricChart
          data={metrics.cpuHistory}
          title="CPU Utilization Over Time"
          color="hsl(210 100% 60%)"
          unit="%"
        />
        <MetricChart
          data={metrics.memoryHistory}
          title="Memory Utilization Over Time"
          color="hsl(210 100% 60%)"
          unit="%"
        />
        <MetricChart
          data={metrics.diskHistory}
          title="Disk Usage Over Time"
          color="hsl(210 100% 60%)"
          unit="%"
        />
      </div>
    </section>
  );
};
