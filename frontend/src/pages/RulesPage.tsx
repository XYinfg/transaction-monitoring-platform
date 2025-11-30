import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { rulesService } from '../services/rulesService';
import { capitalize } from '../utils/format';
import { getSeverityColor } from '../utils/colors';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';

interface RuleFormData {
  name: string;
  description: string;
  type: string;
  severity: string;
  enabled: boolean;
  condition: Record<string, any>;
}

const RULE_TYPES = [
  { value: 'large_transaction', label: 'Large Transaction', description: 'Detects unusually large transactions' },
  { value: 'velocity', label: 'Velocity Check', description: 'Detects rapid successive transactions' },
  { value: 'structuring', label: 'Structuring', description: 'Detects multiple transactions below threshold' },
  { value: 'unusual_pattern', label: 'Unusual Pattern', description: 'Detects statistical anomalies' },
];

const DEFAULT_CONFIGS = {
  large_transaction: { multiplier: 3, lookbackDays: 30 },
  velocity: { maxTransactions: 5, windowMinutes: 60 },
  structuring: { maxTransactions: 3, threshold: 9000, windowHours: 24 },
  unusual_pattern: { standardDeviations: 3, minTransactions: 10, lookbackDays: 30 },
};

export default function RulesPage() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingRule, setEditingRule] = useState<any>(null);
  const [formData, setFormData] = useState<RuleFormData>({
    name: '',
    description: '',
    type: 'large_transaction',
    severity: 'medium',
    enabled: true,
    condition: DEFAULT_CONFIGS.large_transaction,
  });

  const { data: rules, isLoading } = useQuery({
    queryKey: ['rules'],
    queryFn: rulesService.getRules,
  });

  const createMutation = useMutation({
    mutationFn: rulesService.createRule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rules'] });
      toast.success('Rule created successfully');
      closeModal();
    },
    onError: () => {
      toast.error('Failed to create rule');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => rulesService.updateRule(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rules'] });
      toast.success('Rule updated successfully');
      closeModal();
    },
    onError: () => {
      toast.error('Failed to update rule');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: rulesService.deleteRule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rules'] });
      toast.success('Rule deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete rule');
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, shouldEnable }: { id: string; shouldEnable: boolean }) =>
      shouldEnable ? rulesService.enableRule(id) : rulesService.disableRule(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rules'] });
      toast.success('Rule status updated');
    },
    onError: () => {
      toast.error('Failed to update rule status');
    },
  });

  const openCreateModal = () => {
    setEditingRule(null);
    setFormData({
      name: '',
      description: '',
      type: 'large_transaction',
      severity: 'medium',
      enabled: true,
      condition: DEFAULT_CONFIGS.large_transaction,
    });
    setShowModal(true);
  };

  const openEditModal = (rule: any) => {
    setEditingRule(rule);
    setFormData({
      name: rule.name,
      description: rule.description,
      type: rule.type,
      severity: rule.severity,
      enabled: rule.enabled,
      condition: rule.condition || DEFAULT_CONFIGS[rule.type as keyof typeof DEFAULT_CONFIGS],
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingRule(null);
  };

  const handleRuleTypeChange = (type: string) => {
    setFormData({
      ...formData,
      type,
      condition: DEFAULT_CONFIGS[type as keyof typeof DEFAULT_CONFIGS] || {},
    });
  };

  const handleConfigChange = (key: string, value: any) => {
    setFormData({
      ...formData,
      condition: {
        ...formData.condition,
        [key]: value,
      },
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingRule) {
      updateMutation.mutate({ id: editingRule.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  const handleToggleActive = (id: string, enabled: boolean) => {
    toggleActiveMutation.mutate({ id, shouldEnable: !enabled });
  };

  const renderConfigFields = () => {
    const config = formData.condition;
    const type = formData.type;

    switch (type) {
      case 'large_transaction':
        return (
          <>
            <div>
              <label className="label">Multiplier</label>
              <input
                type="number"
                step="0.1"
                className="input"
                value={config.multiplier || 3}
                onChange={(e) => handleConfigChange('multiplier', parseFloat(e.target.value))}
              />
              <p className="mt-1 text-xs text-gray-500">Transaction amount multiplier vs average</p>
            </div>
            <div>
              <label className="label">Lookback Days</label>
              <input
                type="number"
                className="input"
                value={config.lookbackDays || 30}
                onChange={(e) => handleConfigChange('lookbackDays', parseInt(e.target.value))}
              />
              <p className="mt-1 text-xs text-gray-500">Days to look back for calculating average</p>
            </div>
          </>
        );

      case 'velocity':
        return (
          <>
            <div>
              <label className="label">Max Transactions</label>
              <input
                type="number"
                className="input"
                value={config.maxTransactions || 5}
                onChange={(e) => handleConfigChange('maxTransactions', parseInt(e.target.value))}
              />
              <p className="mt-1 text-xs text-gray-500">Maximum transactions allowed in window</p>
            </div>
            <div>
              <label className="label">Window (Minutes)</label>
              <input
                type="number"
                className="input"
                value={config.windowMinutes || 60}
                onChange={(e) => handleConfigChange('windowMinutes', parseInt(e.target.value))}
              />
              <p className="mt-1 text-xs text-gray-500">Time window for counting transactions</p>
            </div>
          </>
        );

      case 'structuring':
        return (
          <>
            <div>
              <label className="label">Max Transactions</label>
              <input
                type="number"
                className="input"
                value={config.maxTransactions || 3}
                onChange={(e) => handleConfigChange('maxTransactions', parseInt(e.target.value))}
              />
              <p className="mt-1 text-xs text-gray-500">Number of transactions to trigger alert</p>
            </div>
            <div>
              <label className="label">Threshold Amount</label>
              <input
                type="number"
                className="input"
                value={config.threshold || 9000}
                onChange={(e) => handleConfigChange('threshold', parseInt(e.target.value))}
              />
              <p className="mt-1 text-xs text-gray-500">Amount threshold for each transaction</p>
            </div>
            <div>
              <label className="label">Window (Hours)</label>
              <input
                type="number"
                className="input"
                value={config.windowHours || 24}
                onChange={(e) => handleConfigChange('windowHours', parseInt(e.target.value))}
              />
              <p className="mt-1 text-xs text-gray-500">Time window for counting transactions</p>
            </div>
          </>
        );

      case 'unusual_pattern':
        return (
          <>
            <div>
              <label className="label">Standard Deviations</label>
              <input
                type="number"
                step="0.1"
                className="input"
                value={config.standardDeviations || 3}
                onChange={(e) => handleConfigChange('standardDeviations', parseFloat(e.target.value))}
              />
              <p className="mt-1 text-xs text-gray-500">Number of standard deviations from mean</p>
            </div>
            <div>
              <label className="label">Min Transactions</label>
              <input
                type="number"
                className="input"
                value={config.minTransactions || 10}
                onChange={(e) => handleConfigChange('minTransactions', parseInt(e.target.value))}
              />
              <p className="mt-1 text-xs text-gray-500">Minimum transactions required for analysis</p>
            </div>
            <div>
              <label className="label">Lookback Days</label>
              <input
                type="number"
                className="input"
                value={config.lookbackDays || 30}
                onChange={(e) => handleConfigChange('lookbackDays', parseInt(e.target.value))}
              />
              <p className="mt-1 text-xs text-gray-500">Days to look back for pattern analysis</p>
            </div>
          </>
        );

      default:
        return null;
    }
  };

  if (isLoading) return <LoadingSpinner text="Loading rules..." />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Detection Rules</h1>
          <p className="mt-1 text-sm text-gray-500">Configure AML/fraud detection rules</p>
        </div>
        <button onClick={openCreateModal} className="btn-primary">
          Create Rule
        </button>
      </div>

      {rules && rules.length === 0 ? (
        <EmptyState
          icon="📋"
          title="No rules configured"
          description="Create your first detection rule to start monitoring transactions"
          action={{ label: 'Create Rule', onClick: openCreateModal }}
        />
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {rules?.map((rule) => (
            <div key={rule.id} className="card">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-medium text-gray-900">{rule.name}</h3>
                    <span className={`badge ${getSeverityColor(rule.severity)}`}>
                      {capitalize(rule.severity)}
                    </span>
                    <span className={`badge ${rule.enabled ? 'badge-success' : 'badge-gray'}`}>
                      {rule.enabled ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{rule.description}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="capitalize">{rule.type.replace('_', ' ')}</span>
                    <span>•</span>
                    <span>Config: {JSON.stringify(rule.condition)}</span>
                  </div>
                </div>
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => handleToggleActive(rule.id, rule.enabled)}
                    className={`btn-sm ${rule.enabled ? 'btn-secondary' : 'btn-primary'}`}
                    disabled={toggleActiveMutation.isPending}
                  >
                    {rule.enabled ? 'Disable' : 'Enable'}
                  </button>
                  <button
                    onClick={() => openEditModal(rule)}
                    className="btn-secondary btn-sm"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(rule.id, rule.name)}
                    className="text-red-600 hover:text-red-800 px-3"
                    disabled={deleteMutation.isPending}
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/80 p-4">
          <div className="card max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {editingRule ? 'Edit Rule' : 'Create Rule'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Rule Name</label>
                <input
                  type="text"
                  required
                  className="input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Large Transaction Alert"
                />
              </div>

              <div>
                <label className="label">Description</label>
                <textarea
                  required
                  className="input"
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe what this rule detects..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Rule Type</label>
                  <select
                    className="input"
                    value={formData.type}
                    onChange={(e) => handleRuleTypeChange(e.target.value)}
                    disabled={!!editingRule}
                  >
                    {RULE_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-gray-500">
                    {RULE_TYPES.find((t) => t.value === formData.type)?.description}
                  </p>
                </div>

                <div>
                  <label className="label">Severity</label>
                  <select
                    className="input"
                    value={formData.severity}
                    onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Rule Configuration</h4>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {renderConfigFields()}
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="enabled"
                  checked={formData.enabled}
                  onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="enabled" className="ml-2 text-sm text-gray-700">
                  Enable rule immediately
                </label>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
                <button type="button" onClick={closeModal} className="btn-secondary">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="btn-primary"
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? 'Saving...'
                    : editingRule
                    ? 'Update Rule'
                    : 'Create Rule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
