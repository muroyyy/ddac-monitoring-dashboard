import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Save, Loader2, Clock, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useSettings } from '@/hooks/useSettings';
import { AWSEnvironmentSection } from '@/components/settings/AWSEnvironmentSection';
import { EC2SettingsSection } from '@/components/settings/EC2SettingsSection';
import { RDSSettingsSection } from '@/components/settings/RDSSettingsSection';
import { ServerlessSettingsSection } from '@/components/settings/ServerlessSettingsSection';
import { ThresholdSettingsSection } from '@/components/settings/ThresholdSettingsSection';
import { MonitoringSettings } from '@/types/settings';
import { format } from 'date-fns';

const Settings = () => {
  const { settings, isLoading, isSaving, saveSettings } = useSettings();
  const [localSettings, setLocalSettings] = useState<MonitoringSettings>(settings);
  const { toast } = useToast();

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleSave = async () => {
    const result = await saveSettings(localSettings);
    if (result.success) {
      toast({
        title: 'Settings saved',
        description: 'Monitoring configuration has been updated successfully.',
      });
    } else {
      toast({
        title: 'Error saving settings',
        description: 'Failed to save configuration. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const hasChanges = JSON.stringify(settings) !== JSON.stringify(localSettings);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background bg-grid">
      <header className="sticky top-0 z-10 border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <Link to="/">
                <Button variant="ghost" size="icon" className="shrink-0">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-semibold text-foreground">
                    Monitoring Settings
                  </h1>
                  <div className="flex items-center gap-1 rounded-full bg-metric-health/10 px-2 py-0.5">
                    <Shield className="h-3 w-3 text-metric-health" />
                    <span className="text-xs font-medium text-metric-health">Admin</span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Configure AWS resources and monitoring parameters
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {settings.updatedAt && (
                <div className="hidden items-center gap-2 text-sm text-muted-foreground sm:flex">
                  <Clock className="h-4 w-4" />
                  <span>
                    Last updated: {format(new Date(settings.updatedAt), 'MMM d, HH:mm')}
                  </span>
                </div>
              )}
              <Button
                onClick={handleSave}
                disabled={!hasChanges || isSaving}
                className="gap-2"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save & Apply
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto space-y-6 px-6 py-8">
        <AWSEnvironmentSection
          settings={localSettings.aws}
          onChange={(aws) => setLocalSettings({ ...localSettings, aws })}
        />

        <EC2SettingsSection
          settings={localSettings.ec2}
          onChange={(ec2) => setLocalSettings({ ...localSettings, ec2 })}
        />

        <RDSSettingsSection
          settings={localSettings.rds}
          onChange={(rds) => setLocalSettings({ ...localSettings, rds })}
        />

        <ServerlessSettingsSection
          settings={localSettings.serverless}
          onChange={(serverless) => setLocalSettings({ ...localSettings, serverless })}
        />

        <ThresholdSettingsSection
          settings={localSettings.thresholds}
          onChange={(thresholds) => setLocalSettings({ ...localSettings, thresholds })}
        />

        <div className="rounded-lg border border-border bg-card p-6">
          <h3 className="mb-2 text-lg font-semibold text-foreground">
            Backend Integration Notes
          </h3>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              Currently using local storage for demonstration. In production, connect to:
            </p>
            <ul className="ml-4 list-disc space-y-1">
              <li><code className="rounded bg-secondary px-1 py-0.5 font-mono text-xs">GET /api/settings</code> — Fetch current configuration</li>
              <li><code className="rounded bg-secondary px-1 py-0.5 font-mono text-xs">POST /api/settings</code> — Save updated configuration</li>
              <li>Store settings in <code className="rounded bg-secondary px-1 py-0.5 font-mono text-xs">monitoring_settings</code> database table</li>
              <li>Backend should use AWS SDK to dynamically query CloudWatch based on these settings</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Settings;
