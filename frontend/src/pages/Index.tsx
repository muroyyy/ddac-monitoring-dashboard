import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { EC2Section } from '@/components/dashboard/EC2Section';
import { RDSSection } from '@/components/dashboard/RDSSection';
import { LambdaSection } from '@/components/dashboard/LambdaSection';
import { HealthSection } from '@/components/dashboard/HealthSection';
import { useMetrics } from '@/hooks/useMetrics';

const Index = () => {
  const {
    ec2Metrics,
    rdsMetrics,
    lambdaMetrics,
    apiGatewayMetrics,
    healthStatus,
    deploymentInfo,
    lastUpdated,
    isRefreshing,
    refreshMetrics,
  } = useMetrics(30000);

  return (
    <div className="min-h-screen bg-background bg-grid">
      <DashboardHeader
        lastUpdated={lastUpdated}
        isRefreshing={isRefreshing}
        deploymentInfo={deploymentInfo}
        onRefresh={refreshMetrics}
      />

      <main className="container mx-auto space-y-8 px-6 py-8">
        <HealthSection healthStatus={healthStatus} />
        <EC2Section metrics={ec2Metrics} />
        <RDSSection metrics={rdsMetrics} />
        <LambdaSection
          lambdaMetrics={lambdaMetrics}
          apiGatewayMetrics={apiGatewayMetrics}
        />

        <footer className="border-t border-border pt-6 text-center text-sm text-muted-foreground">
          <p>
            AWS CloudWatch Monitoring Dashboard — DDAC Group 3 Project
          </p>
          <p className="mt-1">
            Data refreshes automatically every 30 seconds
          </p>
        </footer>
      </main>
    </div>
  );
};

export default Index;
