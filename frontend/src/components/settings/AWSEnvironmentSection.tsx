import { Globe, Server } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AWSEnvironmentSettings, AWS_REGIONS } from '@/types/settings';

interface AWSEnvironmentSectionProps {
  settings: AWSEnvironmentSettings;
  onChange: (settings: AWSEnvironmentSettings) => void;
}

export const AWSEnvironmentSection = ({ settings, onChange }: AWSEnvironmentSectionProps) => {
  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <Globe className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">AWS Environment</h3>
          <p className="text-sm text-muted-foreground">Configure your AWS region and environment</p>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="region">AWS Region</Label>
          <Select
            value={settings.region}
            onValueChange={(value) => onChange({ ...settings, region: value })}
          >
            <SelectTrigger id="region" className="bg-secondary">
              <SelectValue placeholder="Select region" />
            </SelectTrigger>
            <SelectContent>
              {AWS_REGIONS.map((region) => (
                <SelectItem key={region.value} value={region.value}>
                  {region.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="environment">Environment</Label>
          <Select
            value={settings.environment}
            onValueChange={(value: 'dev' | 'staging' | 'production') => 
              onChange({ ...settings, environment: value })
            }
          >
            <SelectTrigger id="environment" className="bg-secondary">
              <SelectValue placeholder="Select environment" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="dev">Development</SelectItem>
              <SelectItem value="staging">Staging</SelectItem>
              <SelectItem value="production">Production</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};
