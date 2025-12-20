import { Database, Cpu, MemoryStick, Users, HardDrive } from 'lucide-react';
import { MetricCard } from './MetricCard';
import { MetricChart } from './MetricChart';
import { RDSMetrics } from '@/types/metrics';

interface RDSSectionProps {
  metrics: RDSMetrics;
}

export const RDSSection = ({ metrics }: RDSSectionProps) => {
  return (
    <section className="space-y-4">
      <div className="section-header">
        <Database className="h-5 w-5 text-metric-rds" />
        <span>RDS Database{metrics.resourceName ? ` - ${metrics.resourceName}` : ' (MySQL)'}</span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <MetricCard
          title="CPU Utilization"
          value={metrics.cpuUtilization}
          unit="%"
          trend="stable"
          trendValue="Normal"
          icon={<Cpu className="h-4 w-4" />}
          variant="rds"
        />
        <MetricCard
          title="Freeable Memory"
          value={metrics.freeableMemory}
          unit="GB"
          trend="stable"
          trendValue="Adequate"
          icon={<MemoryStick className="h-4 w-4" />}
          variant="rds"
        />
        <MetricCard
          title="Connections"
          value={metrics.databaseConnections}
          unit=""
          trend="up"
          trendValue="+3 active"
          icon={<Users className="h-4 w-4" />}
          variant="rds"
        />
        <MetricCard
          title="Read IOPS"
          value={metrics.readIOPS}
          unit="/s"
          trend="stable"
          trendValue="Normal"
          icon={<HardDrive className="h-4 w-4" />}
          variant="rds"
        />
        <MetricCard
          title="Write IOPS"
          value={metrics.writeIOPS}
          unit="/s"
          trend="stable"
          trendValue="Normal"
          icon={<HardDrive className="h-4 w-4" />}
          variant="rds"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <MetricChart
          data={metrics.cpuHistory}
          title="Database CPU Over Time"
          color="hsl(168 84% 45%)"
          unit="%"
        />
        <MetricChart
          data={metrics.connectionsHistory}
          title="Database Connections Over Time"
          color="hsl(168 84% 45%)"
          unit=""
          type="bar"
        />
      </div>
    </section>
  );
};
