import { Gauge } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { ThresholdSettings } from '@/types/settings';

interface ThresholdSettingsSectionProps {
  settings: ThresholdSettings;
  onChange: (settings: ThresholdSettings) => void;
}

export const ThresholdSettingsSection = ({ settings, onChange }: ThresholdSettingsSectionProps) => {
  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-metric-health/10">
          <Gauge className="h-5 w-5 text-metric-health" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">Alert Thresholds</h3>
          <p className="text-sm text-muted-foreground">Configure warning levels and refresh interval</p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="refresh-interval">Metrics Refresh Interval</Label>
          <Select
            value={settings.refreshInterval.toString()}
            onValueChange={(value) => 
              onChange({ ...settings, refreshInterval: parseInt(value) as 30 | 60 | 120 })
            }
          >
            <SelectTrigger id="refresh-interval" className="bg-secondary">
              <SelectValue placeholder="Select interval" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30">30 seconds</SelectItem>
              <SelectItem value="60">60 seconds</SelectItem>
              <SelectItem value="120">120 seconds</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>CPU Warning Level</Label>
              <span className="font-mono text-sm text-metric-warning">
                {settings.cpuWarningLevel}%
              </span>
            </div>
            <Slider
              value={[settings.cpuWarningLevel]}
              onValueChange={([value]) => onChange({ ...settings, cpuWarningLevel: value })}
              min={50}
              max={95}
              step={5}
              className="[&_[role=slider]]:bg-metric-warning"
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Memory Warning Level</Label>
              <span className="font-mono text-sm text-metric-warning">
                {settings.memoryWarningLevel}%
              </span>
            </div>
            <Slider
              value={[settings.memoryWarningLevel]}
              onValueChange={([value]) => onChange({ ...settings, memoryWarningLevel: value })}
              min={50}
              max={95}
              step={5}
              className="[&_[role=slider]]:bg-metric-warning"
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Error Rate Threshold</Label>
              <span className="font-mono text-sm text-metric-error">
                {settings.errorRateThreshold}%
              </span>
            </div>
            <Slider
              value={[settings.errorRateThreshold]}
              onValueChange={([value]) => onChange({ ...settings, errorRateThreshold: value })}
              min={1}
              max={20}
              step={1}
              className="[&_[role=slider]]:bg-metric-error"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
