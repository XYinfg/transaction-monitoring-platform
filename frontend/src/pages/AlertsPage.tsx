import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { alertsService } from '../services/alertsService';
import { formatRelativeTime } from '../utils/format';
import { getStatusColor, getSeverityColor } from '../utils/colors';
import { capitalize } from '../utils/format';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';

export default function AlertsPage() {
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['alerts', page, statusFilter],
    queryFn: () => alertsService.getAlerts(page, 20, statusFilter || undefined),
  });

  const { data: stats } = useQuery({
    queryKey: ['alert-statistics'],
    queryFn: alertsService.getStatistics,
  });

  if (isLoading) return <LoadingSpinner text="Loading alerts..." />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Alerts</h1>
        <p className="mt-1 text-sm text-gray-500">AML/Fraud detection alerts</p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          <div className="card">
            <dt className="text-xs font-medium text-gray-500">Total</dt>
            <dd className="mt-1 text-2xl font-semibold text-gray-900">{stats.total}</dd>
          </div>
          <div className="card">
            <dt className="text-xs font-medium text-gray-500">Open</dt>
            <dd className="mt-1 text-2xl font-semibold text-yellow-600">{stats.open}</dd>
          </div>
          <div className="card">
            <dt className="text-xs font-medium text-gray-500">Reviewing</dt>
            <dd className="mt-1 text-2xl font-semibold text-blue-600">{stats.reviewing}</dd>
          </div>
          <div className="card">
            <dt className="text-xs font-medium text-gray-500">Resolved</dt>
            <dd className="mt-1 text-2xl font-semibold text-green-600">{stats.resolved}</dd>
          </div>
          <div className="card">
            <dt className="text-xs font-medium text-gray-500">False Positive</dt>
            <dd className="mt-1 text-2xl font-semibold text-gray-600">{stats.falsePositive}</dd>
          </div>
          <div className="card">
            <dt className="text-xs font-medium text-gray-500">Escalated</dt>
            <dd className="mt-1 text-2xl font-semibold text-red-600">{stats.escalated}</dd>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card">
        <label className="label">Filter by Status</label>
        <select
          className="input max-w-xs"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All Statuses</option>
          <option value="open">Open</option>
          <option value="reviewing">Reviewing</option>
          <option value="resolved">Resolved</option>
          <option value="false_positive">False Positive</option>
          <option value="escalated">Escalated</option>
        </select>
      </div>

      {/* Alerts List */}
      {data && data.data.length === 0 ? (
        <EmptyState icon="🚨" title="No alerts found" description="All clear! No alerts match your filter." />
      ) : (
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Rule</th>
                  <th>Severity</th>
                  <th>Status</th>
                  <th>User</th>
                  <th>Created</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {data?.data.map((alert) => (
                  <tr key={alert.id}>
                    <td className="font-medium">{alert.rule?.name || 'Unknown Rule'}</td>
                    <td>
                      <span className={`badge ${getSeverityColor(alert.rule?.severity || 'medium')}`}>
                        {capitalize(alert.rule?.severity || 'medium')}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${getStatusColor(alert.status)}`}>
                        {capitalize(alert.status.replace('_', ' '))}
                      </span>
                    </td>
                    <td>{alert.user ? `${alert.user.firstName} ${alert.user.lastName}` : '-'}</td>
                    <td className="text-sm text-gray-500">{formatRelativeTime(alert.createdAt)}</td>
                    <td>
                      <Link to={`/alerts/${alert.id}`} className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-gray-200 px-6 py-3">
              <div className="text-sm text-gray-700">
                Page {data.page} of {data.totalPages}
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
                  disabled={page >= data.totalPages}
                  className="btn-secondary btn-sm"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
