import { Link, useNavigate } from 'react-router-dom';
import { RefreshCw, Clock, GitBranch, CheckCircle2, Settings, LogOut, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DeploymentInfo } from '@/types/metrics';
import { AWSAccountConfig } from '@/types/settings';
import { format, formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface DashboardHeaderProps {
  lastUpdated: Date;
  isRefreshing: boolean;
  deploymentInfo: DeploymentInfo;
  onRefresh: () => void;
  selectedAccount: AWSAccountConfig | null;
  accounts: AWSAccountConfig[];
  onAccountChange: (account: AWSAccountConfig) => void;
}

export const DashboardHeader = ({
  lastUpdated,
  isRefreshing,
  deploymentInfo,
  onRefresh,
  selectedAccount,
  accounts,
  onAccountChange,
}: DashboardHeaderProps) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('sessionToken');
    navigate('/login');
  };
  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm">
      <div className="container mx-auto px-6 py-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div>
                <h1 className="text-xl font-semibold text-foreground">
                  AWS Monitoring Dashboard
                </h1>
                <p className="text-sm text-muted-foreground">
                  {selectedAccount ? selectedAccount.accountName : 'Multi-Account Cloud Monitoring'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            {/* Account Selector */}
            {accounts.length > 0 && selectedAccount && (
              <Select
                value={selectedAccount.id}
                onValueChange={(id) => {
                  const account = accounts.find(a => a.id === id);
                  if (account) onAccountChange(account);
                }}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.accountName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

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

            {/* Logout Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};
