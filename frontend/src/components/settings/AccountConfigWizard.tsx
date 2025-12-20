import { useState } from 'react';
import { Check, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AWSAccountConfig, AWS_REGIONS } from '@/types/settings';

interface AccountConfigWizardProps {
  account: AWSAccountConfig | null;
  onSave: (account: AWSAccountConfig) => void;
  onCancel: () => void;
}

export const AccountConfigWizard = ({ account, onSave, onCancel }: AccountConfigWizardProps) => {
  const [step, setStep] = useState(1);
  const [accountName, setAccountName] = useState(account?.accountName || '');
  const [accountId, setAccountId] = useState(account?.accountId || '');
  const [accessKeyId, setAccessKeyId] = useState(account?.accessKeyId || '');
  const [secretAccessKey, setSecretAccessKey] = useState(account?.secretAccessKey || '');
  const [region, setRegion] = useState(account?.region || '');
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [isValidated, setIsValidated] = useState(account?.isValidated || false);

  const handleValidateCredentials = async () => {
    setIsValidating(true);
    setValidationError('');

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/settings/validate-credentials`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessKeyId, secretAccessKey, region })
      });

      if (response.ok) {
        setIsValidated(true);
        setStep(3);
      } else {
        const error = await response.json();
        setValidationError(error.message || 'Failed to validate credentials');
      }
    } catch (err) {
      setValidationError('Connection failed. Please check your credentials and try again.');
    } finally {
      setIsValidating(false);
    }
  };

  const handleSave = async () => {
    const generateId = () => {
      if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
      }
      return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    };

    const newAccount: AWSAccountConfig = {
      id: account?.id || generateId(),
      accountName,
      accountId,
      accessKeyId,
      secretAccessKey,
      region,
      isValidated,
      createdAt: account?.createdAt || new Date().toISOString()
    };
    
    try {
      const sessionToken = localStorage.getItem('sessionToken');
      const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/settings/accounts`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`
        },
        body: JSON.stringify(newAccount)
      });

      if (!response.ok) throw new Error('Failed to save account');
      onSave(newAccount);
    } catch (err) {
      setValidationError('Failed to save account to database');
    }
  };

  const steps = [
    { number: 1, title: 'Account Info', completed: step > 1 },
    { number: 2, title: 'Credentials', completed: step > 2 },
    { number: 3, title: 'Resources', completed: step > 3 }
  ];

  return (
    <div className="max-w-3xl mx-auto">
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((s, idx) => (
            <div key={s.number} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${
                  s.completed ? 'border-green-500 bg-green-500 text-white' :
                  step === s.number ? 'border-primary bg-primary text-white' :
                  'border-gray-300 bg-white text-gray-400'
                }`}>
                  {s.completed ? <Check className="h-5 w-5" /> : s.number}
                </div>
                <span className="mt-2 text-sm font-medium">{s.title}</span>
              </div>
              {idx < steps.length - 1 && (
                <div className={`flex-1 h-0.5 mx-4 ${s.completed ? 'bg-green-500' : 'bg-gray-300'}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="rounded-lg border border-border bg-card p-6">
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold mb-2">Account Information</h2>
              <p className="text-sm text-muted-foreground">
                Enter details to identify this AWS account
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="accountName">Account Name *</Label>
                <Input
                  id="accountName"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  placeholder="e.g., Bloodline Production"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="accountId">AWS Account ID *</Label>
                <Input
                  id="accountId"
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  placeholder="123456789012"
                  maxLength={12}
                />
                <p className="text-xs text-muted-foreground">12-digit AWS account number</p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={onCancel}>Cancel</Button>
              <Button 
                onClick={() => setStep(2)}
                disabled={!accountName || accountId.length !== 12}
              >
                Next: Credentials
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold mb-2">AWS Credentials</h2>
              <p className="text-sm text-muted-foreground">
                Enter IAM user credentials with CloudWatch read permissions
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="region">AWS Region *</Label>
                <Select value={region} onValueChange={setRegion}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select region" />
                  </SelectTrigger>
                  <SelectContent>
                    {AWS_REGIONS.map((r) => (
                      <SelectItem key={r.value} value={r.value}>
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="accessKeyId">Access Key ID *</Label>
                <Input
                  id="accessKeyId"
                  value={accessKeyId}
                  onChange={(e) => setAccessKeyId(e.target.value)}
                  placeholder="AKIA..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="secretAccessKey">Secret Access Key *</Label>
                <Input
                  id="secretAccessKey"
                  type="password"
                  value={secretAccessKey}
                  onChange={(e) => setSecretAccessKey(e.target.value)}
                  placeholder="Enter secret access key"
                />
              </div>

              {validationError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{validationError}</AlertDescription>
                </Alert>
              )}
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
              <Button 
                onClick={handleValidateCredentials}
                disabled={!region || !accessKeyId || !secretAccessKey || isValidating}
              >
                {isValidating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Validating...
                  </>
                ) : (
                  'Validate & Continue'
                )}
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold mb-2">Resource Discovery</h2>
              <p className="text-sm text-muted-foreground">
                Discovering resources in your AWS account...
              </p>
            </div>

            <Alert>
              <Check className="h-4 w-4 text-green-600" />
              <AlertDescription>
                Credentials validated successfully! Resource discovery will be implemented next.
              </AlertDescription>
            </Alert>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(2)}>Back</Button>
              <Button onClick={handleSave}>
                Save Account
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
