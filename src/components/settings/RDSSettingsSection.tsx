import { Database } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { RDSSettings, MOCK_RDS_INSTANCES } from '@/types/settings';

interface RDSSettingsSectionProps {
  settings: RDSSettings;
  onChange: (settings: RDSSettings) => void;
}

export const RDSSettingsSection = ({ settings, onChange }: RDSSettingsSectionProps) => {
  const handleInstanceChange = (identifier: string) => {
    const instance = MOCK_RDS_INSTANCES.find(i => i.instanceIdentifier === identifier);
    if (instance) {
      onChange({
        ...settings,
        instanceIdentifier: instance.instanceIdentifier,
        engine: instance.engine,
        instanceClass: instance.instanceClass,
      });
    }
  };

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-metric-rds/10">
            <Database className="h-5 w-5 text-metric-rds" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">RDS Configuration</h3>
            <p className="text-sm text-muted-foreground">Select RDS instance to monitor</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="rds-enabled" className="text-sm text-muted-foreground">
            Enable
          </Label>
          <Switch
            id="rds-enabled"
            checked={settings.enabled}
            onCheckedChange={(enabled) => onChange({ ...settings, enabled })}
          />
        </div>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="rds-instance">RDS Instance</Label>
          <Select
            value={settings.instanceIdentifier}
            onValueChange={handleInstanceChange}
            disabled={!settings.enabled}
          >
            <SelectTrigger id="rds-instance" className="bg-secondary">
              <SelectValue placeholder="Select RDS instance" />
            </SelectTrigger>
            <SelectContent>
              {MOCK_RDS_INSTANCES.map((instance) => (
                <SelectItem key={instance.instanceIdentifier} value={instance.instanceIdentifier}>
                  {instance.instanceIdentifier}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {settings.enabled && (
          <div className="grid gap-4 rounded-lg bg-secondary/50 p-4 sm:grid-cols-2">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Database Engine
              </p>
              <p className="mt-1 font-mono text-sm text-foreground">{settings.engine}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Instance Class
              </p>
              <p className="mt-1 font-mono text-sm text-foreground">{settings.instanceClass}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
