// frontend/src/components/dashboard/insights/RecommendationsPanel.jsx
/**
 * Recommendations Panel Component
 *
 * This component displays cost optimization recommendations aggregated
 * from all configured cloud providers. It helps users identify opportunities
 * to reduce cloud spending through actionable suggestions.
 *
 * Features:
 * - Total potential savings summary (monthly and yearly)
 * - Category-based filtering (e.g., compute, storage, networking)
 * - Individual recommendation cards with details
 * - Effort level indicators (low, medium, high)
 * - Impact level display
 * - Provider-specific icons
 * - Loading and error states
 *
 * Data fetched from the /api/recommendations/all endpoint which aggregates
 * recommendations from AWS, Azure, and GCP, sorted by potential savings.
 *
 * Used in the Insights tab alongside AlertsPanel and AnomalyDetectionPanel.
 */

import React, {useState} from 'react';

// Custom hook for fetching aggregated recommendations from all providers
import {useRecommendations} from '../../../hooks/useCloudData';

/**
 * RecommendationsPanel - Renders cost optimization recommendations with filtering
 *
 * @returns {JSX.Element} Recommendations panel with savings summary and recommendation list
 */
export default function RecommendationsPanel() {
    // Fetch recommendations data using custom hook
    const {data, loading, error} = useRecommendations();

    // Category filter state: 'all' or specific category name
    const [filterCategory, setFilterCategory] = useState('all');

    // =====================
    // Loading State
    // =====================
    if (loading) return <div className="loading">
        <div className="loading-spinner"></div>
        Loading recommendations...</div>;

    // =====================
    // Error State
    // =====================
    if (error) return <div className="error">Failed to load recommendations</div>;

    // =====================
    // Data Extraction
    // =====================
    // Extract recommendations array and savings totals from API response
    const recommendations = data?.recommendations || [];
    const totalSavings = data?.total_potential_savings_monthly || 0;
    const yearlySavings = data?.total_potential_savings_yearly || 0;

    // Build list of unique categories from recommendations
    // Starts with 'all' option, then adds each unique category
    // filter(Boolean) removes any null/undefined categories
    const categories = ['all', ...new Set(recommendations.map(r => r.category).filter(Boolean))];

    // Apply category filter to recommendations
    // 'all' shows everything, other values filter by category field
    const filteredRecs = filterCategory === 'all'
        ? recommendations
        : recommendations.filter(r => r.category === filterCategory);

    /**
     * Get CSS class for effort level badge
     *
     * Effort levels indicate implementation complexity:
     * - low (green): Quick wins, easy to implement
     * - medium (yellow): Moderate effort required
     * - high (red): Significant work needed
     *
     * @param {string} effort - Effort level (low, medium, high)
     * @returns {string} CSS class name for styling
     */
    const getEffortBadge = (effort) => {
        const colors = {low: 'status-healthy', medium: 'status-warning', high: 'status-error'};
        return colors[effort] || '';
    };

    /**
     * Get emoji icon for cloud provider
     *
     * Icons match the visual language used throughout the dashboard.
     *
     * @param {string} provider - Provider name (aws, azure, gcp)
     * @returns {string} Emoji icon for the provider
     */
    const getProviderIcon = (provider) => {
        const icons = {aws: '🟠', azure: '🔷', gcp: '☁️'};
        return icons[provider] || '☁️';  // Default to cloud emoji
    };

    // =====================
    // Render
    // =====================
    return (
        <div className="card">
            {/* Card header with title and total savings badge */}
            <div className="card-header">
                <span className="card-icon">💡</span>
                <h4>Cost Optimization Recommendations</h4>
                {/* Quick reference badge showing monthly savings potential */}
                <span className="savings-badge">${totalSavings.toLocaleString()}/mo</span>
            </div>

            {/* Savings summary section */}
            {/* Shows key metrics: monthly savings, yearly savings, recommendation count */}
            <div className="savings-summary">
                {/* Monthly savings potential */}
                <div className="savings-stat">
                    <span className="savings-value">${totalSavings.toLocaleString()}</span>
                    <span className="savings-label">Monthly Savings</span>
                </div>

                {/* Yearly savings potential (monthly * 12) */}
                <div className="savings-stat">
                    <span className="savings-value">${yearlySavings.toLocaleString()}</span>
                    <span className="savings-label">Yearly Savings</span>
                </div>

                {/* Total recommendation count */}
                <div className="savings-stat">
                    <span className="savings-value">{recommendations.length}</span>
                    <span className="savings-label">Recommendations</span>
                </div>
            </div>

            {/* Category filter buttons */}
            {/* Dynamically generated from unique categories in data */}
            <div className="filter-buttons">
                {categories.map(cat => (
                    <button
                        key={cat}
                        className={`btn btn-secondary ${filterCategory === cat ? 'active' : ''}`}
                        onClick={() => setFilterCategory(cat)}
                    >
                        {/* Show count in parentheses for each category */}
                        {cat === 'all' ? `All (${recommendations.length})` : `${cat} (${recommendations.filter(r => r.category === cat).length})`}
                    </button>
                ))}
            </div>

            {/* Recommendations list */}
            <div className="recommendations-list">
                {filteredRecs.length === 0 ? (
                    // Empty state for current filter
                    <div className="no-data">No recommendations in this category</div>
                ) : (
                    // Map through filtered recommendations
                    filteredRecs.map(rec => (
                        // Unique key combines provider and id for uniqueness
                        <div key={`${rec.provider}-${rec.id}`} className="rec-item">
                            {/* Recommendation header with provider, title, and savings */}
                            <div className="rec-header">
                                {/* Provider icon */}
                                <span className="rec-provider">{getProviderIcon(rec.provider)}</span>

                                {/* Title and category section */}
                                <div className="rec-title-section">
                                    <div className="rec-title">{rec.title}</div>
                                    <div className="rec-category">{rec.category}</div>
                                </div>

                                {/* Savings amount for this recommendation */}
                                <div className="rec-savings">
                                    <span
                                        className="rec-savings-value">${rec.potential_savings_monthly?.toLocaleString()}</span>
                                    <span className="rec-savings-period">/month</span>
                                </div>
                            </div>

                            {/* Detailed description of the recommendation */}
                            <div className="rec-description">{rec.description}</div>

                            {/* Metadata: effort level and impact */}
                            <div className="rec-meta">
                                {/* Effort badge with color coding */}
                                <span className={`rec-effort ${getEffortBadge(rec.effort)}`}>Effort: {rec.effort}</span>
                                {/* Impact level (high, medium, low) */}
                                <span className="rec-impact">Impact: {rec.impact}</span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}