// frontend/src/components/dashboard/budgets/BudgetTracker.jsx
/**
 * Budget Tracker Component
 *
 * This component displays budget allocations, spending, and utilization
 * across all configured cloud providers. It provides a comprehensive
 * view of budget health with visual progress indicators.
 *
 * Features:
 * - Toggle between provider view and category view
 * - Overall budget summary with progress bar
 * - Key stats: utilization percentage, budget count, at-risk count
 * - Individual budget cards with detailed metrics
 * - Visual status indicators (on track vs at risk)
 * - Color-coded progress bars based on utilization thresholds
 * - Projected utilization for forward-looking insights
 *
 * Data fetched from the /api/budgets/all endpoint which aggregates
 * budget data from AWS, Azure, and GCP.
 *
 * Used in the Budgets tab alongside the ForecastingChart component.
 */

import React, {useState} from 'react';

// Custom hook for fetching aggregated budget data from all providers
import {useBudgets} from '../../../hooks/useCloudData';

/**
 * BudgetTracker - Renders budget tracking dashboard with utilization metrics
 *
 * @returns {JSX.Element} Budget tracker panel with summary and individual budgets
 */
export default function BudgetTracker() {
    // Fetch budget data using custom hook
    const {data, loading, error} = useBudgets();

    // View mode toggle state: 'provider' shows overall budgets, 'category' shows category budgets
    const [viewMode, setViewMode] = useState('provider');

    // =====================
    // Loading State
    // =====================
    if (loading) return <div className="loading">
        <div className="loading-spinner"></div>
        Loading budgets...</div>;

    // =====================
    // Error State
    // =====================
    if (error) return <div className="error">Failed to load budget data</div>;

    // =====================
    // Data Extraction
    // =====================
    // Extract budget data and summary metrics from API response
    // Use defaults to handle missing data gracefully
    const budgets = data?.budgets || [];                    // Array of individual budget items
    const totalBudget = data?.total_budget || 0;            // Sum of all budget allocations
    const totalSpent = data?.total_spent || 0;              // Sum of all spending
    const totalRemaining = data?.total_remaining || 0;      // totalBudget - totalSpent
    const overallUtilization = data?.overall_utilization || 0;  // Percentage of total budget used
    const atRiskCount = data?.at_risk_count || 0;           // Number of budgets exceeding thresholds

    // Filter budgets based on type for view switching
    // 'overall' type: Provider-level budgets (AWS, Azure, GCP)
    // 'category' type: Service category budgets (Compute, Storage, etc.)
    const overallBudgets = budgets.filter(b => b.type === 'overall');
    const categoryBudgets = budgets.filter(b => b.type === 'category');
    const displayBudgets = viewMode === 'provider' ? overallBudgets : categoryBudgets;

    /**
     * Determine color for utilization percentage based on thresholds
     *
     * Color coding provides visual urgency:
     * - >= 100%: Red (danger) - budget exceeded
     * - >= 80%: Yellow/orange (warning) - approaching limit
     * - < 80%: Green (success) - healthy utilization
     *
     * @param {number} percent - Utilization percentage
     * @returns {string} CSS variable for the appropriate color
     */
    const getUtilizationColor = (percent) => {
        if (percent >= 100) return 'var(--danger)';
        if (percent >= 80) return 'var(--warning)';
        return 'var(--success)';
    };

    /**
     * Get icon emoji for cloud provider
     *
     * Icons match the visual language used throughout the dashboard.
     *
     * @param {string} provider - Provider name (aws, azure, gcp)
     * @returns {string} Emoji icon for the provider
     */
    const getProviderIcon = (provider) => {
        const icons = {aws: '🟠', azure: '🔷', gcp: '☁️'};
        return icons[provider] || '💰';  // Default money bag for unknown
    };

    // =====================
    // Render
    // =====================
    return (
        <div className="card budget-card">
            {/* Card header with title and view toggle */}
            <div className="card-header">
                <span className="card-icon">💵</span>
                <h4>Budget Tracking</h4>

                {/* View mode toggle buttons */}
                {/* Switches between provider-level and category-level budget views */}
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

            {/* Overall budget summary section */}
            <div className="budget-summary">
                {/* Total budget card with progress visualization */}
                <div className="budget-total">
                    <div className="budget-total-header">
                        <span>💰</span>
                        <span>Total Budget</span>
                    </div>
                    {/* Total budget amount formatted with locale separators */}
                    <div className="budget-total-value">${totalBudget.toLocaleString()}</div>

                    {/* Overall progress bar showing utilization */}
                    {/* Capped at 100% width but color indicates if exceeded */}
                    <div className="budget-progress">
                        <div className="progress-bar" style={{
                            width: `${Math.min(overallUtilization, 100)}%`,
                            background: getUtilizationColor(overallUtilization)
                        }}></div>
                    </div>

                    {/* Spent and remaining amounts */}
                    <div className="budget-total-details">
                        <span className="spent">${totalSpent.toLocaleString()} spent</span>
                        <span className="remaining">${totalRemaining.toLocaleString()} remaining</span>
                    </div>
                </div>

                {/* Key budget statistics */}
                <div className="budget-stats">
                    {/* Utilization percentage - color coded */}
                    <div className="budget-stat">
                        <span className="stat-value"
                              style={{color: getUtilizationColor(overallUtilization)}}>{overallUtilization.toFixed(1)}%</span>
                        <span className="stat-label">Utilization</span>
                    </div>

                    {/* Total count of configured budgets */}
                    <div className="budget-stat">
                        <span className="stat-value">{budgets.length}</span>
                        <span className="stat-label">Budgets</span>
                    </div>

                    {/* Count of at-risk budgets - warning color if any */}
                    <div className="budget-stat">
                        <span className="stat-value"
                              style={{color: atRiskCount > 0 ? 'var(--warning)' : 'var(--success)'}}>{atRiskCount}</span>
                        <span className="stat-label">At Risk</span>
                    </div>
                </div>
            </div>

            {/* Individual budget items list */}
            <div className="budgets-list">
                {displayBudgets.length === 0 ? (
                    // Empty state for current view mode
                    <div className="no-data">No budgets in this view</div>
                ) : (
                    // Map through budgets for current view mode
                    displayBudgets.map(budget => (
                        // Budget item with conditional at-risk styling
                        <div key={budget.id} className={`budget-item ${budget.status === 'at_risk' ? 'at-risk' : ''}`}>
                            {/* Budget header with icon, name, and status */}
                            <div className="budget-item-header">
                                {/* Provider icon for overall budgets, folder for categories */}
                                <span
                                    className="budget-icon">{budget.type === 'overall' ? getProviderIcon(budget.provider) : '📁'}</span>

                                {/* Budget name and optional category label */}
                                <div className="budget-name-section">
                                    <span className="budget-name">{budget.name}</span>
                                    {budget.category && <span className="budget-category">{budget.category}</span>}
                                </div>

                                {/* Status badge with emoji indicator */}
                                <span className={`budget-status ${budget.status}`}>
                  {budget.status === 'on_track' ? '✅ On Track' : '⚠️ At Risk'}
                </span>
                            </div>

                            {/* Budget amounts: allocated, spent, and remaining */}
                            <div className="budget-amounts">
                                {/* Allocated budget amount */}
                                <div className="amount"><span className="amount-label">Budget</span><span
                                    className="amount-value">${budget.budget_amount?.toLocaleString()}</span></div>

                                {/* Amount spent so far */}
                                <div className="amount"><span className="amount-label">Spent</span><span
                                    className="amount-value spent">${budget.spent_amount?.toLocaleString()}</span></div>

                                {/* Remaining amount - red if negative (over budget) */}
                                <div className="amount"><span className="amount-label">Remaining</span><span
                                    className={`amount-value ${budget.remaining_amount < 0 ? 'negative' : 'remaining'}`}>${budget.remaining_amount?.toLocaleString()}</span>
                                </div>
                            </div>

                            {/* Progress bar with current and projected utilization */}
                            <div className="budget-item-progress">
                                {/* Labels showing current vs projected percentages */}
                                <div className="progress-labels">
                                    <span>Current: {budget.utilization_percent?.toFixed(1)}%</span>
                                    <span>Projected: {budget.projected_utilization?.toFixed(1)}%</span>
                                </div>

                                {/* Visual progress bar capped at 100% width */}
                                <div className="progress-track">
                                    <div className="progress-fill" style={{
                                        width: `${Math.min(budget.utilization_percent, 100)}%`,
                                        background: getUtilizationColor(budget.utilization_percent)
                                    }}></div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}