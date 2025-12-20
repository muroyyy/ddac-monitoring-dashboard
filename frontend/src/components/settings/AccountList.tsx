import { Cloud, Edit, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AWSAccountConfig } from '@/types/settings';

interface AccountListProps {
  accounts: AWSAccountConfig[];
  onEdit: (account: AWSAccountConfig) => void;
  onDelete: (accountId: string) => void;
}

export const AccountList = ({ accounts, onEdit, onDelete }: AccountListProps) => {
  if (accounts.length === 0) {
    return (
      <div className="text-center py-12">
        <Cloud className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No AWS Accounts Configured</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Add your first AWS account to start monitoring resources
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Configured AWS Accounts</h2>
      <div className="grid gap-4">
        {accounts.map((account) => (
          <Card key={account.id} className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Cloud className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-semibold">{account.accountName}</h3>
                    {account.isValidated ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Account ID: {account.accountId}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>Region: {account.region}</span>
                    <span>•</span>
                    <span>Added: {new Date(account.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(account)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDelete(account.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
