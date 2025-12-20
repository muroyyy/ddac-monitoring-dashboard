import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Server, Database, Zap } from 'lucide-react';

interface Resource {
  type: string;
  resourceId: string;
  name: string;
  isEnabled: boolean;
}

interface ResourceSelectorProps {
  accountId: string;
  credentials: {
    accessKeyId: string;
    secretAccessKey: string;
    region: string;
  };
}

export const ResourceSelector = ({ accountId, credentials }: ResourceSelectorProps) => {
  const [ec2Instances, setEc2Instances] = useState<any[]>([]);
  const [rdsInstances, setRdsInstances] = useState<any[]>([]);
  const [lambdaFunctions, setLambdaFunctions] = useState<any[]>([]);
  const [selectedResources, setSelectedResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadResources();
  }, [accountId]);

  const loadResources = async () => {
    try {
      setLoading(true);
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const sessionToken = localStorage.getItem('sessionToken');

      // Discover available resources
      const discoverResponse = await fetch(`${apiUrl}/api/settings/discover-resources`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });

      if (discoverResponse.ok) {
        const discovered = await discoverResponse.json();
        setEc2Instances(discovered.ec2Instances || []);
        setRdsInstances(discovered.rdsInstances || []);
        setLambdaFunctions(discovered.lambdaFunctions || []);
      }

      // Load saved selections
      const savedResponse = await fetch(`${apiUrl}/api/settings/accounts/${accountId}/resources`, {
        headers: { 'Authorization': `Bearer ${sessionToken}` }
      });

      if (savedResponse.ok) {
        const saved = await savedResponse.json();
        setSelectedResources(saved);
      }
    } catch (err) {
      console.error('Failed to load resources:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleResource = (type: string, resourceId: string, name: string) => {
    const existing = selectedResources.find(r => r.type === type && r.resourceId === resourceId);
    if (existing) {
      setSelectedResources(selectedResources.filter(r => !(r.type === type && r.resourceId === resourceId)));
    } else {
      setSelectedResources([...selectedResources, { type, resourceId, name, isEnabled: true }]);
    }
  };

  const isSelected = (type: string, resourceId: string) => {
    return selectedResources.some(r => r.type === type && r.resourceId === resourceId);
  };

  const handleSave = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const sessionToken = localStorage.getItem('sessionToken');

      const response = await fetch(`${apiUrl}/api/settings/accounts/${accountId}/resources`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`
        },
        body: JSON.stringify({ resources: selectedResources })
      });

      if (response.ok) {
        alert('Resources saved successfully!');
      }
    } catch (err) {
      console.error('Failed to save resources:', err);
      alert('Failed to save resources');
    }
  };

  if (loading) return <div>Loading resources...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Server className="h-5 w-5" />
          EC2 Instances
        </h3>
        <div className="space-y-2">
          {ec2Instances.length === 0 ? (
            <p className="text-sm text-muted-foreground">No EC2 instances found</p>
          ) : (
            ec2Instances.map((instance) => (
              <div key={instance.instanceId} className="flex items-center space-x-2">
                <Checkbox
                  id={`ec2-${instance.instanceId}`}
                  checked={isSelected('ec2', instance.instanceId)}
                  onCheckedChange={() => toggleResource('ec2', instance.instanceId, instance.name)}
                />
                <Label htmlFor={`ec2-${instance.instanceId}`} className="cursor-pointer">
                  {instance.name} ({instance.instanceId}) - {instance.state}
                </Label>
              </div>
            ))
          )}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Database className="h-5 w-5" />
          RDS Databases
        </h3>
        <div className="space-y-2">
          {rdsInstances.length === 0 ? (
            <p className="text-sm text-muted-foreground">No RDS instances found</p>
          ) : (
            rdsInstances.map((instance) => (
              <div key={instance.identifier} className="flex items-center space-x-2">
                <Checkbox
                  id={`rds-${instance.identifier}`}
                  checked={isSelected('rds', instance.identifier)}
                  onCheckedChange={() => toggleResource('rds', instance.identifier, instance.identifier)}
                />
                <Label htmlFor={`rds-${instance.identifier}`} className="cursor-pointer">
                  {instance.identifier} - {instance.engine}
                </Label>
              </div>
            ))
          )}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Lambda Functions
        </h3>
        <div className="space-y-2">
          {lambdaFunctions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No Lambda functions found</p>
          ) : (
            lambdaFunctions.map((fn) => (
              <div key={fn.functionName} className="flex items-center space-x-2">
                <Checkbox
                  id={`lambda-${fn.functionName}`}
                  checked={isSelected('lambda', fn.functionName)}
                  onCheckedChange={() => toggleResource('lambda', fn.functionName, fn.functionName)}
                />
                <Label htmlFor={`lambda-${fn.functionName}`} className="cursor-pointer">
                  {fn.functionName} - {fn.runtime}
                </Label>
              </div>
            ))
          )}
        </div>
      </div>

      <Button onClick={handleSave} className="w-full">
        Save Resource Selection
      </Button>
    </div>
  );
};
