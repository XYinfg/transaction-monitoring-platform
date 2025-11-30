import { useQuery } from '@tanstack/react-query';
import { analyticsService } from '../services/analyticsService';
import { accountsService } from '../services/accountsService';
import { formatCurrency } from '../utils/format';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { CHART_COLORS } from '../utils/colors';

export default function DashboardPage() {
  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['analytics-summary'],
    queryFn: () => analyticsService.getSummary(),
  });

  const { data: accounts, isLoading: accountsLoading } = useQuery({
    queryKey: ['accounts'],
    queryFn: accountsService.getAccounts,
  });

  const { data: categoryBreakdown } = useQuery({
    queryKey: ['category-breakdown'],
    queryFn: () => analyticsService.getCategoryBreakdown(),
  });

  const { data: trends } = useQuery({
    queryKey: ['trends'],
    queryFn: () => analyticsService.getTrends(6),
  });

  if (summaryLoading || accountsLoading) {
    return <LoadingSpinner text="Loading dashboard..." />;
  }

  const totalBalance = accounts?.reduce((sum, acc) => sum + Number(acc.balance), 0) || 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Overview of your financial activity
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card">
          <dt className="text-sm font-medium text-gray-500">Total Balance</dt>
          <dd className="mt-1 text-3xl font-semibold text-gray-900">
            {formatCurrency(totalBalance)}
          </dd>
        </div>

        <div className="card">
          <dt className="text-sm font-medium text-gray-500">Total Income</dt>
          <dd className="mt-1 text-3xl font-semibold text-green-600">
            {formatCurrency(summary?.totalIncome || 0)}
          </dd>
        </div>

        <div className="card">
          <dt className="text-sm font-medium text-gray-500">Total Expenses</dt>
          <dd className="mt-1 text-3xl font-semibold text-red-600">
            {formatCurrency(summary?.totalExpenses || 0)}
          </dd>
        </div>

        <div className="card">
          <dt className="text-sm font-medium text-gray-500">Net Cashflow</dt>
          <dd className={`mt-1 text-3xl font-semibold ${(summary?.netCashflow || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(summary?.netCashflow || 0)}
          </dd>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Category Breakdown */}
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Spending by Category</h3>
          {categoryBreakdown && categoryBreakdown.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryBreakdown}
                  dataKey="totalAmount"
                  nameKey="categoryName"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={(entry) => `${entry.categoryName} (${entry.percentage.toFixed(1)}%)`}
                >
                  {categoryBreakdown.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-gray-500 text-center py-12">No spending data available</p>
          )}
        </div>

        {/* Spending Trends */}
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Spending Trends (6 months)</h3>
          {trends && trends.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={trends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Legend />
                <Bar dataKey="amount" fill="#0ea5e9" name="Spending" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-gray-500 text-center py-12">No trend data available</p>
          )}
        </div>
      </div>

      {/* Accounts */}
      <div className="card">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Your Accounts</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {accounts?.map((account) => (
            <div key={account.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{account.name}</p>
                  <p className="text-xs text-gray-500">{account.institutionName || 'No institution'}</p>
                </div>
                <span className="text-xs text-gray-500">{account.currency}</span>
              </div>
              <p className="mt-2 text-2xl font-semibold text-gray-900">
                {formatCurrency(Number(account.balance), account.currency)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
