import { cn } from '@/lib/utils';

interface StatusIndicatorProps {
  status: 'healthy' | 'warning' | 'error';
  label: string;
  className?: string;
}

export const StatusIndicator = ({ status, label, className }: StatusIndicatorProps) => {
  const statusConfig = {
    healthy: {
      dotClass: 'status-dot-healthy',
      textClass: 'text-metric-success',
      label: 'Healthy',
    },
    warning: {
      dotClass: 'status-dot-warning',
      textClass: 'text-metric-warning',
      label: 'Warning',
    },
    error: {
      dotClass: 'status-dot-error',
      textClass: 'text-metric-error',
      label: 'Error',
    },
  };

  const config = statusConfig[status];

  return (
    <div className={cn('flex items-center gap-3 rounded-lg bg-secondary px-4 py-3', className)}>
      <div className={cn('status-dot', config.dotClass)} />
      <div className="flex-1">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className={cn('text-xs', config.textClass)}>{config.label}</p>
      </div>
    </div>
  );
};
