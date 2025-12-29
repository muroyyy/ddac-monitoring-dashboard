import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { EC2Section } from '@/components/dashboard/EC2Section';
import { RDSSection } from '@/components/dashboard/RDSSection';
import { LambdaSection } from '@/components/dashboard/LambdaSection';
import { HealthSection } from '@/components/dashboard/HealthSection';
import { CloudFrontSection } from '@/components/dashboard/CloudFrontSection';
import { S3Section } from '@/components/dashboard/S3Section';
import { Route53Section } from '@/components/dashboard/Route53Section';
import { useMetrics } from '@/hooks/useMetrics';
import { Button } from '@/components/ui/button';
import { Cloud, Settings } from 'lucide-react';
import { AWSAccountConfig } from '@/types/settings';

const Index = () => {
  const [accounts, setAccounts] = useState<AWSAccountConfig[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<AWSAccountConfig | null>(null);

  useEffect(() => {
    // Load accounts from backend
    const loadAccounts = async () => {
      try {
        const sessionToken = localStorage.getItem('sessionToken');
        const apiUrl = import.meta.env.VITE_API_URL || '';
        const response = await fetch(`${apiUrl}/api/settings/accounts`, {
          headers: { 'Authorization': `Bearer ${sessionToken}` }
        });
        
        if (response.ok) {
          const data = await response.json();
          setAccounts(data);
          if (data.length > 0) {
            setSelectedAccount(data[0]);
          }
        }
      } catch (err) {
        console.error('Failed to load accounts:', err);
      }
    };
    
    loadAccounts();
  }, []);

  const {
    ec2Metrics,
    rdsMetrics,
    lambdaMetrics,
    apiGatewayMetrics,
    cloudFrontMetrics,
    s3Metrics,
    route53Metrics,
    healthStatus,
    deploymentInfo,
    lastUpdated,
    isRefreshing,
    error,
    refreshMetrics,
  } = useMetrics(selectedAccount, 30000);

  // Show empty state if no accounts configured
  if (accounts.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardHeader
          lastUpdated={lastUpdated}
          isRefreshing={isRefreshing}
          deploymentInfo={deploymentInfo}
          onRefresh={refreshMetrics}
          selectedAccount={null}
          accounts={[]}
          onAccountChange={() => {}}
        />

        <main className="container mx-auto px-6 py-8">
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 mb-6">
              <Cloud className="h-10 w-10 text-primary" />
            </div>
            <h2 className="text-2xl font-semibold mb-2">No AWS Accounts Configured</h2>
            <p className="text-muted-foreground mb-8 max-w-md">
              Get started by adding your first AWS account to begin monitoring your cloud resources.
            </p>
            <Link to="/settings">
              <Button size="lg" className="gap-2">
                <Settings className="h-5 w-5" />
                Configure AWS Account
              </Button>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background bg-grid">
      <DashboardHeader
        lastUpdated={lastUpdated}
        isRefreshing={isRefreshing}
        deploymentInfo={deploymentInfo}
        onRefresh={refreshMetrics}
        selectedAccount={selectedAccount}
        accounts={accounts}
        onAccountChange={setSelectedAccount}
      />

      <main className="container mx-auto space-y-8 px-6 py-8">
        {!ec2Metrics && !rdsMetrics && !lambdaMetrics && !error && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading metrics...</p>
          </div>
        )}
        {error && (
          <div className="text-center py-12">
            <p className="text-red-600">Error: {error}</p>
          </div>
        )}
        {healthStatus && <HealthSection healthStatus={healthStatus} />}
        {cloudFrontMetrics && <CloudFrontSection metrics={cloudFrontMetrics} />}
        {s3Metrics && <S3Section metrics={s3Metrics} />}
        {route53Metrics && <Route53Section metrics={route53Metrics} />}
        {ec2Metrics && <EC2Section metrics={ec2Metrics} />}
        {rdsMetrics && <RDSSection metrics={rdsMetrics} />}
        {lambdaMetrics && apiGatewayMetrics && (
          <LambdaSection
            lambdaMetrics={lambdaMetrics}
            apiGatewayMetrics={apiGatewayMetrics}
          />
        )}

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
