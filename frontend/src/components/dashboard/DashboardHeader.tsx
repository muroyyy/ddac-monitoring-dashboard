import { Link } from 'react-router-dom';
import { RefreshCw, Clock, GitBranch, CheckCircle2, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DeploymentInfo } from '@/types/metrics';
import { format, formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface DashboardHeaderProps {
  lastUpdated: Date;
  isRefreshing: boolean;
  deploymentInfo: DeploymentInfo;
  onRefresh: () => void;
}

export const DashboardHeader = ({
  lastUpdated,
  isRefreshing,
  deploymentInfo,
  onRefresh,
}: DashboardHeaderProps) => {
  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm">
      <div className="container mx-auto px-6 py-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <div className="h-5 w-5 rounded-full bg-primary animate-pulse-glow" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-foreground">
                  CloudWatch Dashboard
                </h1>
                <p className="text-sm text-muted-foreground">
                  bloodline.dev — Real-time AWS Metrics
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            {/* Deployment Info */}
            <div className="flex items-center gap-3 rounded-lg bg-secondary px-4 py-2">
              <CheckCircle2 className="h-4 w-4 text-metric-success" />
              <div className="text-sm">
                <div className="flex items-center gap-2">
                  <GitBranch className="h-3 w-3 text-muted-foreground" />
                  <span className="font-mono text-xs text-muted-foreground">
                    {deploymentInfo.branch}
                  </span>
                </div>
                <p className="font-mono text-xs text-muted-foreground">
                  {deploymentInfo.buildId}
                </p>
              </div>
            </div>

            {/* Last Updated */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>
                Updated {formatDistanceToNow(lastUpdated, { addSuffix: true })}
              </span>
              {isRefreshing && <div className="refresh-indicator" />}
            </div>

            {/* Refresh Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={isRefreshing}
              className="gap-2"
            >
              <RefreshCw className={cn('h-4 w-4', isRefreshing && 'animate-spin')} />
              Refresh
            </Button>

            {/* Settings Link */}
            <Link to="/settings">
              <Button variant="outline" size="sm" className="gap-2">
                <Settings className="h-4 w-4" />
                Settings
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};
