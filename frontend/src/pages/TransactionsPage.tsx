import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { accountsService } from '../services/accountsService';
import { transactionsService } from '../services/transactionsService';
import { formatCurrency, formatDateTime } from '../utils/format';
import { getAmountColor } from '../utils/colors';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';

export default function TransactionsPage() {
  const queryClient = useQueryClient();
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [showImportModal, setShowImportModal] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [page, setPage] = useState(1);

  const { data: accounts } = useQuery({
    queryKey: ['accounts'],
    queryFn: accountsService.getAccounts,
  });

  const { data: transactionsData, isLoading } = useQuery({
    queryKey: ['transactions', selectedAccountId, page],
    queryFn: () => transactionsService.getTransactions(selectedAccountId, page, 20),
    enabled: !!selectedAccountId,
  });

  const importMutation = useMutation({
    mutationFn: ({ accountId, file }: { accountId: string; file: File }) =>
      transactionsService.importCsv(accountId, file),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast.success(`Imported ${data.successful} transactions`);
      setShowImportModal(false);
      setFile(null);
    },
  });

  const handleImport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    importMutation.mutate({ accountId: selectedAccountId, file });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
          <p className="mt-1 text-sm text-gray-500">View and import your transactions</p>
        </div>
        {selectedAccountId && (
          <button onClick={() => setShowImportModal(true)} className="btn-primary">
            Import CSV
          </button>
        )}
      </div>

      {/* Account Selector */}
      <div className="card">
        <label className="label">Select Account</label>
        <select
          className="input max-w-md"
          value={selectedAccountId}
          onChange={(e) => {
            setSelectedAccountId(e.target.value);
            setPage(1);
          }}
        >
          <option value="">Choose an account...</option>
          {accounts?.map((account) => (
            <option key={account.id} value={account.id}>
              {account.name} - {formatCurrency(Number(account.balance), account.currency)}
            </option>
          ))}
        </select>
      </div>

      {!selectedAccountId ? (
        <EmptyState
          icon="💳"
          title="Select an account"
          description="Choose an account to view its transactions"
        />
      ) : isLoading ? (
        <LoadingSpinner text="Loading transactions..." />
      ) : transactionsData && transactionsData.data.length === 0 ? (
        <EmptyState
          icon="💸"
          title="No transactions yet"
          description="Import transactions from a CSV file or create them manually"
          action={{ label: 'Import CSV', onClick: () => setShowImportModal(true) }}
        />
      ) : (
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Category</th>
                  <th>Merchant</th>
                  <th className="text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {transactionsData?.data.map((txn) => (
                  <tr key={txn.id}>
                    <td>{formatDateTime(txn.timestamp)}</td>
                    <td className="max-w-xs truncate">{txn.description}</td>
                    <td>
                      {txn.category ? (
                        <span className="badge badge-info">{txn.category.name}</span>
                      ) : (
                        <span className="text-gray-400 text-xs">Uncategorized</span>
                      )}
                    </td>
                    <td>{txn.merchant || '-'}</td>
                    <td className={`text-right font-medium ${getAmountColor(txn.amount)}`}>
                      {formatCurrency(txn.amount, txn.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {transactionsData && transactionsData.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-gray-200 px-6 py-3">
              <div className="text-sm text-gray-700">
                Page {transactionsData.page} of {transactionsData.totalPages}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="btn-secondary btn-sm"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= transactionsData.totalPages}
                  className="btn-secondary btn-sm"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/80">
          <div className="card max-w-md w-full mx-4">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Import Transactions</h2>
            <form onSubmit={handleImport} className="space-y-4">
              <div>
                <label className="label">CSV File</label>
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                  required
                />
                <p className="mt-2 text-xs text-gray-500">
                  CSV should have columns: date, description, amount, merchant (optional)
                </p>
              </div>
              <div className="flex gap-3 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowImportModal(false);
                    setFile(null);
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!file || importMutation.isPending}
                  className="btn-primary"
                >
                  {importMutation.isPending ? 'Importing...' : 'Import'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
