import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { accountsService } from '../services/accountsService';
import { formatCurrency, formatDateTime } from '../utils/format';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';

export default function AccountsPage() {
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    currency: 'USD',
    balance: '0',
    accountType: '',
    institutionName: '',
  });

  const { data: accounts, isLoading } = useQuery({
    queryKey: ['accounts'],
    queryFn: accountsService.getAccounts,
  });

  const createMutation = useMutation({
    mutationFn: accountsService.createAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      toast.success('Account created successfully');
      setShowCreateModal(false);
      setFormData({ name: '', currency: 'USD', balance: '0', accountType: '', institutionName: '' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: accountsService.deleteAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      toast.success('Account deleted successfully');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      ...formData,
      balance: parseFloat(formData.balance) || 0,
    });
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) return <LoadingSpinner text="Loading accounts..." />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Accounts</h1>
          <p className="mt-1 text-sm text-gray-500">Manage your financial accounts</p>
        </div>
        <button onClick={() => setShowCreateModal(true)} className="btn-primary">
          Add Account
        </button>
      </div>

      {accounts && accounts.length === 0 ? (
        <EmptyState
          icon="💳"
          title="No accounts yet"
          description="Create your first account to start tracking transactions"
          action={{ label: 'Add Account', onClick: () => setShowCreateModal(true) }}
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {accounts?.map((account) => (
            <div key={account.id} className="card">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-gray-900">{account.name}</h3>
                  <p className="text-sm text-gray-500">{account.institutionName || 'No institution'}</p>
                  <p className="text-xs text-gray-400 mt-1 capitalize">{account.accountType || 'General'}</p>
                </div>
                <button
                  onClick={() => handleDelete(account.id, account.name)}
                  className="text-red-600 hover:text-red-800"
                  disabled={deleteMutation.isPending}
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
              <div className="mt-4">
                <p className="text-3xl font-bold text-gray-900">
                  {formatCurrency(Number(account.balance), account.currency)}
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Created {formatDateTime(account.createdAt)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/80">
          <div className="card max-w-md w-full mx-4">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Create Account</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Account Name</label>
                <input
                  type="text"
                  required
                  className="input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Main Checking"
                />
              </div>
              <div>
                <label className="label">Institution Name</label>
                <input
                  type="text"
                  className="input"
                  value={formData.institutionName}
                  onChange={(e) => setFormData({ ...formData, institutionName: e.target.value })}
                  placeholder="DBS Bank"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Currency</label>
                  <select
                    className="input"
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  >
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                    <option value="SGD">SGD</option>
                  </select>
                </div>
                <div>
                  <label className="label">Initial Balance</label>
                  <input
                    type="number"
                    step="0.01"
                    className="input"
                    value={formData.balance}
                    onChange={(e) => setFormData({ ...formData, balance: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="label">Account Type</label>
                <select
                  className="input"
                  value={formData.accountType}
                  onChange={(e) => setFormData({ ...formData, accountType: e.target.value })}
                >
                  <option value="">Select type</option>
                  <option value="checking">Checking</option>
                  <option value="savings">Savings</option>
                  <option value="credit">Credit Card</option>
                </select>
              </div>
              <div className="flex gap-3 justify-end pt-4">
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={createMutation.isPending} className="btn-primary">
                  {createMutation.isPending ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
