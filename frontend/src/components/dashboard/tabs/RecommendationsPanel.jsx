import React, { useState } from 'react';
import { useRecommendations } from '../../../hooks/useCloudData';

export default function RecommendationsPanel() {
  const { data, loading, error } = useRecommendations();
  const [filterCategory, setFilterCategory] = useState('all');

  if (loading) return <div className="loading"><div className="loading-spinner"></div>Loading recommendations...</div>;
  if (error) return <div className="error">Failed to load recommendations</div>;

  const recommendations = data?.recommendations || [];
  const totalSavings = data?.total_potential_savings_monthly || 0;
  const yearlySavings = data?.total_potential_savings_yearly || 0;

  // Get unique categories from recommendations
  const categories = ['all', ...new Set(recommendations.map(r => r.category).filter(Boolean))];

  // Filter recommendations by category
  const filteredRecs = filterCategory === 'all'
    ? recommendations
    : recommendations.filter(r => r.category === filterCategory);

  const getEffortBadge = (effort) => {
    const colors = { low: 'status-healthy', medium: 'status-warning', high: 'status-error' };
    return colors[effort] || '';
  };

  const getProviderIcon = (provider) => {
    const icons = { aws: '🟠', azure: '🔷', gcp: '☁️' };
    return icons[provider] || '☁️';
  };

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-icon">💡</span>
        <h4>Cost Optimization Recommendations</h4>
        <span className="savings-badge">${totalSavings.toLocaleString()}/mo</span>
      </div>

      <div className="savings-summary">
        <div className="savings-stat">
          <span className="savings-value">${totalSavings.toLocaleString()}</span>
          <span className="savings-label">Monthly Savings</span>
        </div>
        <div className="savings-stat">
          <span className="savings-value">${yearlySavings.toLocaleString()}</span>
          <span className="savings-label">Yearly Savings</span>
        </div>
        <div className="savings-stat">
          <span className="savings-value">{recommendations.length}</span>
          <span className="savings-label">Recommendations</span>
        </div>
      </div>

      <div className="filter-buttons">
        {categories.map(cat => (
          <button
            key={cat}
            className={`btn btn-secondary ${filterCategory === cat ? 'active' : ''}`}
            onClick={() => setFilterCategory(cat)}
          >
            {cat === 'all' ? `All (${recommendations.length})` : `${cat} (${recommendations.filter(r => r.category === cat).length})`}
          </button>
        ))}
      </div>

      <div className="recommendations-list">
        {filteredRecs.length === 0 ? (
          <div className="no-data">No recommendations in this category</div>
        ) : (
          filteredRecs.map(rec => (
            <div key={`${rec.provider}-${rec.id}`} className="rec-item">
              <div className="rec-header">
                <span className="rec-provider">{getProviderIcon(rec.provider)}</span>
                <div className="rec-title-section">
                  <div className="rec-title">{rec.title}</div>
                  <div className="rec-category">{rec.category}</div>
                </div>
                <div className="rec-savings">
                  <span className="rec-savings-value">${rec.potential_savings_monthly?.toLocaleString()}</span>
                  <span className="rec-savings-period">/month</span>
                </div>
              </div>
              <div className="rec-description">{rec.description}</div>
              <div className="rec-meta">
                <span className={`rec-effort ${getEffortBadge(rec.effort)}`}>Effort: {rec.effort}</span>
                <span className="rec-impact">Impact: {rec.impact}</span>
              </div>
            </div>
          ))
        )}
      </div>

      <style>{`
        .savings-badge { background: var(--success); color: white; padding: 4px 12px; border-radius: 12px; font-size: 0.8rem; font-weight: 600; margin-left: auto; }
        .savings-summary { display: flex; gap: 24px; padding: 16px; background: linear-gradient(135deg, rgba(16,185,129,0.1), rgba(79,70,229,0.05)); border-radius: 8px; margin-bottom: 16px; }
        .savings-stat { display: flex; flex-direction: column; }
        .savings-value { font-size: 1.25rem; font-weight: 700; color: var(--success); }
        .savings-label { font-size: 0.7rem; color: var(--text-muted); }
        .filter-buttons { display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap; }
        .filter-buttons .btn { padding: 6px 12px; font-size: 0.75rem; }
        .filter-buttons .btn.active { background: var(--primary); color: white; border-color: var(--primary); }
        .recommendations-list { display: flex; flex-direction: column; gap: 12px; max-height: 400px; overflow-y: auto; }
        .rec-item { padding: 14px; background: var(--bg-secondary); border-radius: 8px; border: 1px solid var(--border); }
        .rec-item:hover { border-color: var(--primary); }
        .rec-header { display: flex; align-items: flex-start; gap: 10px; margin-bottom: 8px; }
        .rec-provider { font-size: 1.2rem; }
        .rec-title-section { flex: 1; }
        .rec-title { font-weight: 600; color: var(--text-primary); font-size: 0.9rem; }
        .rec-category { font-size: 0.7rem; color: var(--text-muted); }
        .rec-savings { text-align: right; }
        .rec-savings-value { font-size: 1rem; font-weight: 700; color: var(--success); }
        .rec-savings-period { font-size: 0.7rem; color: var(--text-muted); }
        .rec-description { font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 10px; line-height: 1.4; }
        .rec-meta { display: flex; gap: 12px; font-size: 0.75rem; }
        .rec-effort, .rec-impact { padding: 2px 8px; border-radius: 4px; background: var(--bg-tertiary); color: var(--text-secondary); text-transform: capitalize; }
        .rec-effort.status-healthy { background: rgba(16,185,129,0.1); color: var(--success); }
        .rec-effort.status-warning { background: rgba(245,158,11,0.1); color: var(--warning); }
        .rec-effort.status-error { background: rgba(239,68,68,0.1); color: var(--danger); }
      `}</style>
    </div>
  );
}