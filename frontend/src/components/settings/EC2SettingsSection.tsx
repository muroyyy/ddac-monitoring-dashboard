import { Server, Circle } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { EC2Settings, MOCK_EC2_INSTANCES } from '@/types/settings';
import { cn } from '@/lib/utils';

interface EC2SettingsSectionProps {
  settings: EC2Settings;
  onChange: (settings: EC2Settings) => void;
}

export const EC2SettingsSection = ({ settings, onChange }: EC2SettingsSectionProps) => {
  const handleInstanceChange = (instanceId: string) => {
    const instance = MOCK_EC2_INSTANCES.find(i => i.instanceId === instanceId);
    if (instance) {
      onChange({
        ...settings,
        instanceId: instance.instanceId,
        instanceName: instance.instanceName,
        instanceType: instance.instanceType,
        state: instance.state,
      });
    }
  };

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-metric-ec2/10">
            <Server className="h-5 w-5 text-metric-ec2" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">EC2 Configuration</h3>
            <p className="text-sm text-muted-foreground">Select EC2 instance to monitor</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="ec2-enabled" className="text-sm text-muted-foreground">
            Enable
          </Label>
          <Switch
            id="ec2-enabled"
            checked={settings.enabled}
            onCheckedChange={(enabled) => onChange({ ...settings, enabled })}
          />
        </div>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="ec2-instance">EC2 Instance</Label>
          <Select
            value={settings.instanceId}
            onValueChange={handleInstanceChange}
            disabled={!settings.enabled}
          >
            <SelectTrigger id="ec2-instance" className="bg-secondary">
              <SelectValue placeholder="Select instance" />
            </SelectTrigger>
            <SelectContent>
              {MOCK_EC2_INSTANCES.map((instance) => (
                <SelectItem key={instance.instanceId} value={instance.instanceId}>
                  <div className="flex items-center gap-2">
                    <Circle 
                      className={cn(
                        'h-2 w-2 fill-current',
                        instance.state === 'running' ? 'text-metric-success' : 'text-muted-foreground'
                      )} 
                    />
                    {instance.instanceName}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {settings.enabled && (
          <div className="grid gap-4 rounded-lg bg-secondary/50 p-4 sm:grid-cols-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Instance ID
              </p>
              <p className="mt-1 font-mono text-sm text-foreground">{settings.instanceId}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Instance Type
              </p>
              <p className="mt-1 font-mono text-sm text-foreground">{settings.instanceType}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                State
              </p>
              <div className="mt-1 flex items-center gap-2">
                <Circle 
                  className={cn(
                    'h-2 w-2 fill-current',
                    settings.state === 'running' ? 'text-metric-success' : 'text-muted-foreground'
                  )} 
                />
                <span className="text-sm capitalize text-foreground">{settings.state}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
