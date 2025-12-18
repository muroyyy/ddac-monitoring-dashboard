import { Zap, Plus, X } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { ServerlessSettings, MOCK_LAMBDA_FUNCTIONS, LambdaFunctionSettings } from '@/types/settings';

interface ServerlessSettingsSectionProps {
  settings: ServerlessSettings;
  onChange: (settings: ServerlessSettings) => void;
}

export const ServerlessSettingsSection = ({ settings, onChange }: ServerlessSettingsSectionProps) => {
  const availableFunctions = MOCK_LAMBDA_FUNCTIONS.filter(
    fn => !settings.lambdaFunctions.some(f => f.functionName === fn.functionName)
  );

  const addFunction = (functionName: string) => {
    const fn = MOCK_LAMBDA_FUNCTIONS.find(f => f.functionName === functionName);
    if (fn) {
      onChange({
        ...settings,
        lambdaFunctions: [
          ...settings.lambdaFunctions,
          { functionName: fn.functionName, runtime: fn.runtime, enabled: true },
        ],
      });
    }
  };

  const removeFunction = (functionName: string) => {
    onChange({
      ...settings,
      lambdaFunctions: settings.lambdaFunctions.filter(f => f.functionName !== functionName),
    });
  };

  const toggleFunction = (functionName: string, enabled: boolean) => {
    onChange({
      ...settings,
      lambdaFunctions: settings.lambdaFunctions.map(f =>
        f.functionName === functionName ? { ...f, enabled } : f
      ),
    });
  };

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-metric-lambda/10">
            <Zap className="h-5 w-5 text-metric-lambda" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Serverless Configuration</h3>
            <p className="text-sm text-muted-foreground">Configure Lambda and API Gateway monitoring</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="serverless-enabled" className="text-sm text-muted-foreground">
            Enable
          </Label>
          <Switch
            id="serverless-enabled"
            checked={settings.enabled}
            onCheckedChange={(enabled) => onChange({ ...settings, enabled })}
          />
        </div>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="api-stage">API Gateway Stage</Label>
          <Select
            value={settings.apiGatewayStage}
            onValueChange={(value) => onChange({ ...settings, apiGatewayStage: value })}
            disabled={!settings.enabled}
          >
            <SelectTrigger id="api-stage" className="bg-secondary">
              <SelectValue placeholder="Select stage" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="dev">dev</SelectItem>
              <SelectItem value="staging">staging</SelectItem>
              <SelectItem value="prod">prod</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Lambda Functions</Label>
            {availableFunctions.length > 0 && settings.enabled && (
              <Select onValueChange={addFunction}>
                <SelectTrigger className="w-auto gap-2 bg-secondary">
                  <Plus className="h-4 w-4" />
                  <span>Add Function</span>
                </SelectTrigger>
                <SelectContent>
                  {availableFunctions.map((fn) => (
                    <SelectItem key={fn.functionName} value={fn.functionName}>
                      {fn.functionName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="space-y-2">
            {settings.lambdaFunctions.map((fn) => (
              <div
                key={fn.functionName}
                className="flex items-center justify-between rounded-lg bg-secondary/50 px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <Switch
                    checked={fn.enabled}
                    onCheckedChange={(enabled) => toggleFunction(fn.functionName, enabled)}
                    disabled={!settings.enabled}
                  />
                  <div>
                    <p className="text-sm font-medium text-foreground">{fn.functionName}</p>
                    <p className="font-mono text-xs text-muted-foreground">{fn.runtime}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeFunction(fn.functionName)}
                  disabled={!settings.enabled}
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
