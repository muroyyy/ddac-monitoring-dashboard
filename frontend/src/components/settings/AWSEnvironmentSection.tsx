import { Globe, Key, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { AWSEnvironmentSettings, AWS_REGIONS } from '@/types/settings';

interface AWSEnvironmentSectionProps {
  settings: AWSEnvironmentSettings;
  onChange: (settings: AWSEnvironmentSettings) => void;
}

export const AWSEnvironmentSection = ({ settings, onChange }: AWSEnvironmentSectionProps) => {
  const [showAccessKey, setShowAccessKey] = useState(false);
  const [showSecretKey, setShowSecretKey] = useState(false);

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <Globe className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">AWS Environment</h3>
          <p className="text-sm text-muted-foreground">Configure AWS credentials for bloodline.dev monitoring</p>
        </div>
      </div>

      <div className="space-y-6">
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

        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-start gap-3">
            <Key className="h-5 w-5 text-amber-600 mt-0.5" />
            <div className="space-y-4 flex-1">
              <div>
                <h4 className="font-medium text-amber-900 mb-1">Cross-Account Monitoring Credentials</h4>
                <p className="text-sm text-amber-700">
                  Enter IAM user credentials from your bloodline.dev AWS account with read-only CloudWatch permissions.
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="accessKeyId" className="text-amber-900">AWS Access Key ID</Label>
                  <div className="relative">
                    <Input
                      id="accessKeyId"
                      type={showAccessKey ? "text" : "password"}
                      value={settings.accessKeyId || ''}
                      onChange={(e) => onChange({ ...settings, accessKeyId: e.target.value })}
                      placeholder="AKIA..."
                      className="bg-white border-amber-200 pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowAccessKey(!showAccessKey)}
                    >
                      {showAccessKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="secretAccessKey" className="text-amber-900">AWS Secret Access Key</Label>
                  <div className="relative">
                    <Input
                      id="secretAccessKey"
                      type={showSecretKey ? "text" : "password"}
                      value={settings.secretAccessKey || ''}
                      onChange={(e) => onChange({ ...settings, secretAccessKey: e.target.value })}
                      placeholder="Enter secret access key"
                      className="bg-white border-amber-200 pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowSecretKey(!showSecretKey)}
                    >
                      {showSecretKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
