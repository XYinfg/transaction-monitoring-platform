import { useQuery } from '@tanstack/react-query';
import { analyticsService } from '../services/analyticsService';
import { formatCurrency } from '../utils/format';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { CHART_COLORS } from '../utils/colors';

export default function AnalyticsPage() {
  const { data: categoryBreakdown } = useQuery({
    queryKey: ['analytics-categories'],
    queryFn: () => analyticsService.getCategoryBreakdown(),
  });

  const { data: cashflow, isLoading: cashflowLoading } = useQuery({
    queryKey: ['analytics-cashflow'],
    queryFn: () => analyticsService.getCashflow(30, 'day'),
  });

  const { data: topMerchants } = useQuery({
    queryKey: ['analytics-merchants'],
    queryFn: () => analyticsService.getTopMerchants(10),
  });

  if (cashflowLoading) return <LoadingSpinner text="Loading analytics..." />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="mt-1 text-sm text-gray-500">Detailed insights into your spending</p>
      </div>

      {/* Cashflow Chart */}
      <div className="card">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Daily Cashflow (Last 30 Days)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={cashflow || []}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip formatter={(value: number) => formatCurrency(value)} />
            <Legend />
            <Line type="monotone" dataKey="income" stroke="#10b981" name="Income" />
            <Line type="monotone" dataKey="expenses" stroke="#ef4444" name="Expenses" />
            <Line type="monotone" dataKey="net" stroke="#0ea5e9" name="Net" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Category Breakdown */}
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Spending by Category</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryBreakdown}
                dataKey="totalAmount"
                nameKey="categoryName"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label
              >
                {categoryBreakdown?.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Top Merchants */}
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Top Merchants</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topMerchants || []} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="merchant" type="category" width={100} />
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
              <Bar dataKey="totalAmount" fill="#0ea5e9" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
