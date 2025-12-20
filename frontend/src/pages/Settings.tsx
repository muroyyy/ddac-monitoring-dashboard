import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Plus, Settings as SettingsIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AccountConfigWizard } from '@/components/settings/AccountConfigWizard';
import { AccountList } from '@/components/settings/AccountList';
import { ResourceSelector } from '@/components/settings/ResourceSelector';
import { AWSAccountConfig } from '@/types/settings';

const Settings = () => {
  const [accounts, setAccounts] = useState<AWSAccountConfig[]>([]);
  const [showWizard, setShowWizard] = useState(false);
  const [editingAccount, setEditingAccount] = useState<AWSAccountConfig | null>(null);
  const [selectedAccountForResources, setSelectedAccountForResources] = useState<AWSAccountConfig | null>(null);

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      const sessionToken = localStorage.getItem('sessionToken');
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const response = await fetch(`${apiUrl}/api/settings/accounts`, {
        headers: { 'Authorization': `Bearer ${sessionToken}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAccounts(data);
      }
    } catch (err) {
      console.error('Failed to load accounts:', err);
    }
  };

  const handleSaveAccount = (account: AWSAccountConfig) => {
    loadAccounts();
    setShowWizard(false);
    setEditingAccount(null);
  };

  const handleEditAccount = (account: AWSAccountConfig) => {
    setEditingAccount(account);
    setShowWizard(true);
  };

  const handleDeleteAccount = async (accountId: string) => {
    try {
      const sessionToken = localStorage.getItem('sessionToken');
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const response = await fetch(`${apiUrl}/api/settings/accounts/${accountId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${sessionToken}` }
      });
      
      if (response.ok) {
        loadAccounts();
      }
    } catch (err) {
      console.error('Failed to delete account:', err);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-semibold text-foreground">
                  Monitoring Settings
                </h1>
                <p className="text-sm text-muted-foreground">
                  Configure AWS accounts and resources to monitor
                </p>
              </div>
            </div>

            {!showWizard && (
              <Button onClick={() => setShowWizard(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Add AWS Account
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {showWizard ? (
          <AccountConfigWizard
            account={editingAccount}
            onSave={handleSaveAccount}
            onCancel={() => {
              setShowWizard(false);
              setEditingAccount(null);
            }}
          />
        ) : selectedAccountForResources ? (
          <div>
            <Button 
              variant="ghost" 
              onClick={() => setSelectedAccountForResources(null)}
              className="mb-4"
            >
              ← Back to Accounts
            </Button>
            <h2 className="text-xl font-semibold mb-4">
              Configure Resources for {selectedAccountForResources.accountName}
            </h2>
            <ResourceSelector 
              accountId={selectedAccountForResources.id}
              credentials={{
                accessKeyId: selectedAccountForResources.accessKeyId,
                secretAccessKey: selectedAccountForResources.secretAccessKey,
                region: selectedAccountForResources.region
              }}
            />
          </div>
        ) : (
          <AccountList
            accounts={accounts}
            onEdit={handleEditAccount}
            onDelete={handleDeleteAccount}
            onConfigureResources={setSelectedAccountForResources}
          />
        )}
      </main>
    </div>
  );
};

export default Settings;
