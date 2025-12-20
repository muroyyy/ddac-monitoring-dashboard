import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Plus, Settings as SettingsIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AccountConfigWizard } from '@/components/settings/AccountConfigWizard';
import { AccountList } from '@/components/settings/AccountList';
import { AWSAccountConfig } from '@/types/settings';

const Settings = () => {
  const [accounts, setAccounts] = useState<AWSAccountConfig[]>([]);
  const [showWizard, setShowWizard] = useState(false);
  const [editingAccount, setEditingAccount] = useState<AWSAccountConfig | null>(null);

  const handleSaveAccount = (account: AWSAccountConfig) => {
    if (editingAccount) {
      setAccounts(accounts.map(a => a.id === account.id ? account : a));
    } else {
      setAccounts([...accounts, account]);
    }
    setShowWizard(false);
    setEditingAccount(null);
  };

  const handleEditAccount = (account: AWSAccountConfig) => {
    setEditingAccount(account);
    setShowWizard(true);
  };

  const handleDeleteAccount = (accountId: string) => {
    setAccounts(accounts.filter(a => a.id !== accountId));
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
        ) : (
          <AccountList
            accounts={accounts}
            onEdit={handleEditAccount}
            onDelete={handleDeleteAccount}
          />
        )}
      </main>
    </div>
  );
};

export default Settings;
