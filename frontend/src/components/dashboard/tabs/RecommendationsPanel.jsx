import React, {useState} from 'react';
import {useRecommendations} from '../../../hooks/useCloudData';

export default function RecommendationsPanel() {
    const {data, loading, error} = useRecommendations();
    const [filterCategory, setFilterCategory] = useState('all');

    if (loading) return <div className="loading">
        <div className="loading-spinner"></div>
        Loading recommendations...</div>;
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
        const colors = {low: 'status-healthy', medium: 'status-warning', high: 'status-error'};
        return colors[effort] || '';
    };

    const getProviderIcon = (provider) => {
        const icons = {aws: '🟠', azure: '🔷', gcp: '☁️'};
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
                                    <span
                                        className="rec-savings-value">${rec.potential_savings_monthly?.toLocaleString()}</span>
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
        </div>
    );
}