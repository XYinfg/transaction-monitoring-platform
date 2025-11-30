export const CHART_COLORS = [
  '#0ea5e9', // blue
  '#10b981', // green
  '#f59e0b', // yellow
  '#ef4444', // red
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#14b8a6', // teal
  '#f97316', // orange
  '#6366f1', // indigo
  '#84cc16', // lime
  '#06b6d4', // cyan
  '#a855f7', // violet
  '#f43f5e', // rose
  '#eab308', // amber
];

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    open: 'text-yellow-600 bg-yellow-100',
    reviewing: 'text-blue-600 bg-blue-100',
    resolved: 'text-green-600 bg-green-100',
    false_positive: 'text-gray-600 bg-gray-100',
    escalated: 'text-red-600 bg-red-100',
  };
  return colors[status] || 'text-gray-600 bg-gray-100';
}

export function getSeverityColor(severity: string): string {
  const colors: Record<string, string> = {
    low: 'text-blue-600 bg-blue-100',
    medium: 'text-yellow-600 bg-yellow-100',
    high: 'text-orange-600 bg-orange-100',
    critical: 'text-red-600 bg-red-100',
  };
  return colors[severity] || 'text-gray-600 bg-gray-100';
}

export function getAmountColor(amount: number): string {
  return amount >= 0 ? 'text-green-600' : 'text-red-600';
}
