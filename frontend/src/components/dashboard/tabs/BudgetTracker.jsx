import React, { useState } from 'react';
import { useBudgets } from '../../../hooks/useCloudData';

export default function BudgetTracker() {
  const { data, loading, error } = useBudgets();
  const [viewMode, setViewMode] = useState('provider');

  if (loading) return <div className="loading"><div className="loading-spinner"></div>Loading budgets...</div>;
  if (error) return <div className="error">Failed to load budget data</div>;

  const budgets = data?.budgets || [];
  const totalBudget = data?.total_budget || 0;
  const totalSpent = data?.total_spent || 0;
  const totalRemaining = data?.total_remaining || 0;
  const overallUtilization = data?.overall_utilization || 0;
  const atRiskCount = data?.at_risk_count || 0;

  const overallBudgets = budgets.filter(b => b.type === 'overall');
  const categoryBudgets = budgets.filter(b => b.type === 'category');
  const displayBudgets = viewMode === 'provider' ? overallBudgets : categoryBudgets;

  const getUtilizationColor = (percent) => {
    if (percent >= 100) return 'var(--danger)';
    if (percent >= 80) return 'var(--warning)';
    return 'var(--success)';
  };

  const getProviderIcon = (provider) => {
    const icons = { aws: '🟠', azure: '🔷', gcp: '☁️' };
    return icons[provider] || '💰';
  };

  return (
    <div className="card budget-card">
      <div className="card-header">
        <span className="card-icon">💵</span>
        <h4>Budget Tracking</h4>
        <div className="view-toggle">
          <button
            className={`toggle-btn ${viewMode === 'provider' ? 'active' : ''}`}
            onClick={() => setViewMode('provider')}
          >
            By Provider
          </button>
          <button
            className={`toggle-btn ${viewMode === 'category' ? 'active' : ''}`}
            onClick={() => setViewMode('category')}
          >
            By Category
          </button>
        </div>
      </div>

      <div className="budget-summary">
        <div className="budget-total">
          <div className="budget-total-header">
            <span>💰</span>
            <span>Total Budget</span>
          </div>
          <div className="budget-total-value">${totalBudget.toLocaleString()}</div>
          <div className="budget-progress">
            <div className="progress-bar" style={{ width: `${Math.min(overallUtilization, 100)}%`, background: getUtilizationColor(overallUtilization) }}></div>
          </div>
          <div className="budget-total-details">
            <span className="spent">${totalSpent.toLocaleString()} spent</span>
            <span className="remaining">${totalRemaining.toLocaleString()} remaining</span>
          </div>
        </div>

        <div className="budget-stats">
          <div className="budget-stat">
            <span className="stat-value" style={{ color: getUtilizationColor(overallUtilization) }}>{overallUtilization.toFixed(1)}%</span>
            <span className="stat-label">Utilization</span>
          </div>
          <div className="budget-stat">
            <span className="stat-value">{budgets.length}</span>
            <span className="stat-label">Budgets</span>
          </div>
          <div className="budget-stat">
            <span className="stat-value" style={{ color: atRiskCount > 0 ? 'var(--warning)' : 'var(--success)' }}>{atRiskCount}</span>
            <span className="stat-label">At Risk</span>
          </div>
        </div>
      </div>

      <div className="budgets-list">
        {displayBudgets.length === 0 ? (
          <div className="no-data">No budgets in this view</div>
        ) : (
          displayBudgets.map(budget => (
            <div key={budget.id} className={`budget-item ${budget.status === 'at_risk' ? 'at-risk' : ''}`}>
              <div className="budget-item-header">
                <span className="budget-icon">{budget.type === 'overall' ? getProviderIcon(budget.provider) : '📁'}</span>
                <div className="budget-name-section">
                  <span className="budget-name">{budget.name}</span>
                  {budget.category && <span className="budget-category">{budget.category}</span>}
                </div>
                <span className={`budget-status ${budget.status}`}>
                  {budget.status === 'on_track' ? '✅ On Track' : '⚠️ At Risk'}
                </span>
              </div>

              <div className="budget-amounts">
                <div className="amount"><span className="amount-label">Budget</span><span className="amount-value">${budget.budget_amount?.toLocaleString()}</span></div>
                <div className="amount"><span className="amount-label">Spent</span><span className="amount-value spent">${budget.spent_amount?.toLocaleString()}</span></div>
                <div className="amount"><span className="amount-label">Remaining</span><span className={`amount-value ${budget.remaining_amount < 0 ? 'negative' : 'remaining'}`}>${budget.remaining_amount?.toLocaleString()}</span></div>
              </div>

              <div className="budget-item-progress">
                <div className="progress-labels">
                  <span>Current: {budget.utilization_percent?.toFixed(1)}%</span>
                  <span>Projected: {budget.projected_utilization?.toFixed(1)}%</span>
                </div>
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: `${Math.min(budget.utilization_percent, 100)}%`, background: getUtilizationColor(budget.utilization_percent) }}></div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <style>{`
        .budget-card .card-header { display: flex; align-items: center; gap: 12px; }
        .budget-card .card-header h4 { flex: 1; margin: 0; }
        .view-toggle { display: flex; background: var(--bg-tertiary); border-radius: 6px; padding: 3px; }
        .toggle-btn { padding: 6px 14px; border: none; background: transparent; color: var(--text-secondary); font-size: 0.8rem; font-weight: 500; cursor: pointer; border-radius: 4px; transition: all 0.2s; }
        .toggle-btn.active { background: var(--primary); color: white; }
        .toggle-btn:hover:not(.active) { background: var(--bg-secondary); }
        .budget-summary { display: flex; gap: 20px; margin-bottom: 20px; }
        .budget-total { flex: 2; background: var(--bg-secondary); border-radius: 8px; padding: 16px; }
        .budget-total-header { display: flex; align-items: center; gap: 8px; font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 8px; }
        .budget-total-value { font-size: 1.75rem; font-weight: 700; color: var(--text-primary); margin-bottom: 12px; }
        .budget-progress { height: 8px; background: var(--bg-tertiary); border-radius: 4px; overflow: hidden; margin-bottom: 8px; }
        .budget-progress .progress-bar { height: 100%; transition: width 0.3s; }
        .budget-total-details { display: flex; justify-content: space-between; font-size: 0.8rem; }
        .budget-total-details .spent { color: var(--warning); }
        .budget-total-details .remaining { color: var(--success); }
        .budget-stats { flex: 1; display: flex; flex-direction: column; gap: 8px; }
        .budget-stat { background: var(--bg-secondary); border-radius: 8px; padding: 12px; text-align: center; }
        .budget-stat .stat-value { font-size: 1.25rem; font-weight: 700; color: var(--text-primary); display: block; }
        .budget-stat .stat-label { font-size: 0.7rem; color: var(--text-muted); }
        .budgets-list { display: flex; flex-direction: column; gap: 12px; max-height: 350px; overflow-y: auto; }
        .budget-item { background: var(--bg-secondary); border-radius: 8px; padding: 16px; border: 1px solid transparent; }
        .budget-item.at-risk { border-color: rgba(245,158,11,0.3); background: rgba(245,158,11,0.05); }
        .budget-item-header { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
        .budget-icon { font-size: 1.25rem; }
        .budget-name-section { flex: 1; }
        .budget-name { font-weight: 600; color: var(--text-primary); display: block; }
        .budget-category { font-size: 0.75rem; color: var(--text-muted); }
        .budget-status { font-size: 0.8rem; color: var(--text-secondary); }
        .budget-amounts { display: flex; gap: 24px; margin-bottom: 12px; }
        .amount { display: flex; flex-direction: column; }
        .amount-label { font-size: 0.7rem; color: var(--text-muted); }
        .amount-value { font-size: 0.95rem; font-weight: 600; color: var(--text-primary); }
        .amount-value.spent { color: var(--warning); }
        .amount-value.remaining { color: var(--success); }
        .amount-value.negative { color: var(--danger); }
        .budget-item-progress .progress-labels { display: flex; justify-content: space-between; font-size: 0.75rem; color: var(--text-muted); margin-bottom: 4px; }
        .progress-track { height: 6px; background: var(--bg-tertiary); border-radius: 3px; overflow: hidden; }
        .progress-fill { height: 100%; transition: width 0.3s; }
      `}</style>
    </div>
  );
}