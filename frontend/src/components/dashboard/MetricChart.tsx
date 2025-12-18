import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { MetricDataPoint } from '@/types/metrics';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface MetricChartProps {
  data: MetricDataPoint[];
  title: string;
  color: string;
  unit?: string;
  type?: 'area' | 'bar';
  className?: string;
}

export const MetricChart = ({
  data,
  title,
  color,
  unit = '',
  type = 'area',
  className,
}: MetricChartProps) => {
  const formattedData = data.map(d => ({
    ...d,
    time: format(new Date(d.timestamp), 'HH:mm'),
    value: parseFloat(d.value.toFixed(2)),
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-lg">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="font-mono text-sm font-semibold text-foreground">
            {payload[0].value.toFixed(2)} {unit}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={cn('chart-container', className)}>
      <h3 className="mb-4 text-sm font-medium text-muted-foreground">{title}</h3>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          {type === 'area' ? (
            <AreaChart data={formattedData}>
              <defs>
                <linearGradient id={`gradient-${title.replace(/\s/g, '')}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 14% 20%)" />
              <XAxis
                dataKey="time"
                tick={{ fill: 'hsl(215 20% 55%)', fontSize: 10 }}
                axisLine={{ stroke: 'hsl(220 14% 20%)' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: 'hsl(215 20% 55%)', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                width={40}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="value"
                stroke={color}
                strokeWidth={2}
                fill={`url(#gradient-${title.replace(/\s/g, '')})`}
              />
            </AreaChart>
          ) : (
            <BarChart data={formattedData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 14% 20%)" />
              <XAxis
                dataKey="time"
                tick={{ fill: 'hsl(215 20% 55%)', fontSize: 10 }}
                axisLine={{ stroke: 'hsl(220 14% 20%)' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: 'hsl(215 20% 55%)', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                width={40}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" fill={color} radius={[4, 4, 0, 0]} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
};
