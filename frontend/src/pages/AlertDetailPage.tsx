import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { alertsService } from '../services/alertsService';
import { formatCurrency, formatDateTime, capitalize } from '../utils/format';
import { getStatusColor, getSeverityColor } from '../utils/colors';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';

export default function AlertDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [notes, setNotes] = useState('');

  const { data: alert, isLoading, error } = useQuery({
    queryKey: ['alert', id],
    queryFn: () => alertsService.getAlert(id!),
    enabled: !!id,
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ status, notes }: { status: string; notes?: string }) =>
      alertsService.updateStatus(id!, status, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alert', id] });
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      queryClient.invalidateQueries({ queryKey: ['alert-statistics'] });
      toast.success('Alert status updated successfully');
      setNotes('');
    },
    onError: () => {
      toast.error('Failed to update alert status');
    },
  });

  const assignMutation = useMutation({
    mutationFn: () => alertsService.assignToMe(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alert', id] });
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      toast.success('Alert assigned to you');
    },
    onError: () => {
      toast.error('Failed to assign alert');
    },
  });

  const handleStatusUpdate = (status: string) => {
    if (['resolved', 'false_positive', 'escalated'].includes(status)) {
      if (!notes.trim()) {
        toast.error('Please provide notes for this action');
        return;
      }
    }
    updateStatusMutation.mutate({ status, notes: notes.trim() || undefined });
  };

  if (isLoading) return <LoadingSpinner text="Loading alert details..." />;
  if (error) return <ErrorMessage message="Failed to load alert details" />;
  if (!alert) return <ErrorMessage message="Alert not found" />;

  const canReview = alert.status === 'open' || alert.status === 'reviewing';
  const isAssigned = alert.assignedTo !== null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link to="/alerts" className="text-sm text-primary-600 hover:text-primary-700 mb-2 inline-block">
            ← Back to Alerts
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Alert #{alert.id.slice(0, 8)}</h1>
          <p className="mt-1 text-sm text-gray-500">Review and manage this alert</p>
        </div>
        <div className="flex gap-3">
          <span className={`badge ${getStatusColor(alert.status)}`}>
            {capitalize(alert.status.replace('_', ' '))}
          </span>
          <span className={`badge ${getSeverityColor(alert.rule?.severity || 'medium')}`}>
            {capitalize(alert.rule?.severity || 'medium')} Severity
          </span>
        </div>
      </div>

      {/* Alert Overview */}
      <div className="card">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Alert Details</h3>
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm font-medium text-gray-500">Rule</dt>
            <dd className="mt-1 text-sm text-gray-900">{alert.rule?.name || 'Unknown Rule'}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Rule Type</dt>
            <dd className="mt-1 text-sm text-gray-900 capitalize">
              {alert.rule?.type?.replace('_', ' ') || 'N/A'}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Created At</dt>
            <dd className="mt-1 text-sm text-gray-900">{formatDateTime(alert.createdAt)}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Updated At</dt>
            <dd className="mt-1 text-sm text-gray-900">{formatDateTime(alert.updatedAt)}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">User</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {alert.user ? `${alert.user.firstName} ${alert.user.lastName}` : '-'}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Assigned To</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {alert.assignedTo ? alert.assignedTo : 'Unassigned'}
            </dd>
          </div>
        </dl>

        {alert.rule?.description && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <dt className="text-sm font-medium text-gray-500 mb-1">Rule Description</dt>
            <dd className="text-sm text-gray-900">{alert.rule.description}</dd>
          </div>
        )}
      </div>

      {/* Transaction Details */}
      {alert.transaction && (
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Transaction Details</h3>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-gray-500">Amount</dt>
              <dd className="mt-1 text-lg font-semibold text-gray-900">
                {formatCurrency(alert.transaction.amount, alert.transaction.currency)}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Transaction Date</dt>
              <dd className="mt-1 text-sm text-gray-900">{formatDateTime(alert.transaction.timestamp)}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Description</dt>
              <dd className="mt-1 text-sm text-gray-900">{alert.transaction.description}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Merchant</dt>
              <dd className="mt-1 text-sm text-gray-900">{alert.transaction.merchant || '-'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Category</dt>
              <dd className="mt-1">
                {alert.transaction.category ? (
                  <span className="badge badge-info">{alert.transaction.category.name}</span>
                ) : (
                  <span className="text-sm text-gray-400">Uncategorized</span>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Transaction ID</dt>
              <dd className="mt-1 text-xs text-gray-500 font-mono">{alert.transaction.id}</dd>
            </div>
          </dl>
        </div>
      )}

      {/* Context Data */}
      {alert.context && Object.keys(alert.context).length > 0 && (
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Detection Context</h3>
          <div className="bg-gray-50 rounded-lg p-4">
            <pre className="text-xs text-gray-700 whitespace-pre-wrap">
              {JSON.stringify(alert.context, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {/* Actions */}
      {canReview && (
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Review Actions</h3>

          {!isAssigned && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800 mb-3">This alert is not assigned. Assign it to yourself to review.</p>
              <button
                onClick={() => assignMutation.mutate()}
                disabled={assignMutation.isPending}
                className="btn-primary btn-sm"
              >
                {assignMutation.isPending ? 'Assigning...' : 'Assign to Me'}
              </button>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="label">Review Notes</label>
              <textarea
                className="input"
                rows={4}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes about your investigation and decision..."
              />
              <p className="mt-1 text-xs text-gray-500">
                Required for resolving, marking as false positive, or escalating
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              {alert.status === 'open' && (
                <button
                  onClick={() => handleStatusUpdate('reviewing')}
                  disabled={updateStatusMutation.isPending}
                  className="btn-secondary"
                >
                  Start Review
                </button>
              )}

              <button
                onClick={() => handleStatusUpdate('resolved')}
                disabled={updateStatusMutation.isPending || !isAssigned}
                className="btn-primary bg-green-600 hover:bg-green-700"
              >
                Mark as Resolved
              </button>

              <button
                onClick={() => handleStatusUpdate('false_positive')}
                disabled={updateStatusMutation.isPending || !isAssigned}
                className="btn-secondary"
              >
                Mark as False Positive
              </button>

              <button
                onClick={() => handleStatusUpdate('escalated')}
                disabled={updateStatusMutation.isPending || !isAssigned}
                className="btn-primary bg-red-600 hover:bg-red-700"
              >
                Escalate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notes History */}
      {alert.notes && (
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Review Notes</h3>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{alert.notes}</p>
          </div>
        </div>
      )}
    </div>
  );
}
