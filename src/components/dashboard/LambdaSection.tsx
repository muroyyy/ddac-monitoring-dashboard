import { Zap, Play, AlertTriangle, Timer, Ban } from 'lucide-react';
import { MetricCard } from './MetricCard';
import { MetricChart } from './MetricChart';
import { LambdaMetrics, APIGatewayMetrics } from '@/types/metrics';

interface LambdaSectionProps {
  lambdaMetrics: LambdaMetrics;
  apiGatewayMetrics: APIGatewayMetrics;
}

export const LambdaSection = ({ lambdaMetrics, apiGatewayMetrics }: LambdaSectionProps) => {
  return (
    <section className="space-y-4">
      <div className="section-header">
        <Zap className="h-5 w-5 text-metric-lambda" />
        <span>Serverless (Lambda & API Gateway)</span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Lambda Invocations"
          value={lambdaMetrics.invocations.toLocaleString()}
          unit=""
          trend="up"
          trendValue="+8% today"
          icon={<Play className="h-4 w-4" />}
          variant="lambda"
        />
        <MetricCard
          title="Lambda Errors"
          value={lambdaMetrics.errors}
          unit=""
          trend={lambdaMetrics.errors > 0 ? 'up' : 'stable'}
          trendValue={lambdaMetrics.errors > 0 ? 'Investigate' : 'None'}
          icon={<AlertTriangle className="h-4 w-4" />}
          variant="lambda"
        />
        <MetricCard
          title="Avg Duration"
          value={lambdaMetrics.duration}
          unit="ms"
          trend="stable"
          trendValue="Normal"
          icon={<Timer className="h-4 w-4" />}
          variant="lambda"
        />
        <MetricCard
          title="Throttles"
          value={lambdaMetrics.throttles}
          unit=""
          trend="stable"
          trendValue="None"
          icon={<Ban className="h-4 w-4" />}
          variant="lambda"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="API Requests"
          value={apiGatewayMetrics.requestCount.toLocaleString()}
          unit=""
          trend="up"
          trendValue="+15%"
          icon={<Zap className="h-4 w-4" />}
          variant="lambda"
        />
        <MetricCard
          title="API Latency"
          value={apiGatewayMetrics.latency}
          unit="ms"
          trend="stable"
          trendValue="Good"
          icon={<Timer className="h-4 w-4" />}
          variant="lambda"
        />
        <MetricCard
          title="4xx Errors"
          value={apiGatewayMetrics.count4xx}
          unit=""
          trend={apiGatewayMetrics.count4xx > 20 ? 'up' : 'stable'}
          trendValue={apiGatewayMetrics.count4xx > 20 ? 'Review' : 'Low'}
          icon={<AlertTriangle className="h-4 w-4" />}
          variant="lambda"
        />
        <MetricCard
          title="5xx Errors"
          value={apiGatewayMetrics.count5xx}
          unit=""
          trend={apiGatewayMetrics.count5xx > 0 ? 'up' : 'stable'}
          trendValue={apiGatewayMetrics.count5xx > 0 ? 'Alert' : 'None'}
          icon={<AlertTriangle className="h-4 w-4" />}
          variant="lambda"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <MetricChart
          data={lambdaMetrics.invocationsHistory}
          title="Lambda Invocations Over Time"
          color="hsl(270 70% 60%)"
          unit=""
        />
        <MetricChart
          data={apiGatewayMetrics.requestHistory}
          title="API Gateway Requests Over Time"
          color="hsl(270 70% 60%)"
          unit=""
        />
      </div>
    </section>
  );
};
