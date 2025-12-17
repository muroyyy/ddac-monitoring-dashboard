import { ReactNode } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: string;
  icon?: ReactNode;
  variant?: 'ec2' | 'rds' | 'lambda' | 'health';
  className?: string;
}

export const MetricCard = ({
  title,
  value,
  unit,
  trend,
  trendValue,
  icon,
  variant = 'ec2',
  className,
}: MetricCardProps) => {
  const getTrendIcon = () => {
    if (trend === 'up') return <TrendingUp className="h-3 w-3" />;
    if (trend === 'down') return <TrendingDown className="h-3 w-3" />;
    return <Minus className="h-3 w-3" />;
  };

  const getTrendColor = () => {
    if (trend === 'up') return 'text-metric-success';
    if (trend === 'down') return 'text-metric-error';
    return 'text-muted-foreground';
  };

  return (
    <div className={cn('metric-card', `metric-card-${variant}`, className)}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {title}
          </p>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="font-mono text-2xl font-semibold text-foreground">
              {typeof value === 'number' ? value.toFixed(1) : value}
            </span>
            {unit && (
              <span className="text-sm text-muted-foreground">{unit}</span>
            )}
          </div>
          {trend && trendValue && (
            <div className={cn('mt-2 flex items-center gap-1 text-xs', getTrendColor())}>
              {getTrendIcon()}
              <span>{trendValue}</span>
            </div>
          )}
        </div>
        {icon && (
          <div className="rounded-lg bg-secondary p-2 text-muted-foreground">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
};
