// frontend/src/components/dashboard/budgets/BudgetsTab.jsx
/**
 * Budgets Tab Component
 *
 * This component serves as the main container for the Budgets & Forecast
 * section of the dashboard. It combines budget tracking and cost forecasting
 * features into a single view.
 *
 * Layout:
 * - BudgetTracker: Shows budget allocations and utilization percentages
 * - ForecastingChart: Displays projected costs based on current trends
 *
 * The tab provides users with:
 * - Current budget status across all providers
 * - Budget utilization warnings (approaching/exceeded thresholds)
 * - Future cost projections for planning
 * - Trend analysis for cost management
 *
 * This is one of the main navigation tabs in the dashboard,
 * accessible via the tab bar alongside Overview, Insights, and provider tabs.
 */

import React from 'react';

// Child components for budget and forecasting functionality
import ForecastingChart from './ForecastingChart.jsx';  // Cost projection visualization
import BudgetTracker from './BudgetTracker.jsx';        // Budget utilization display

/**
 * BudgetsTab - Main container for budgets and forecasting features
 *
 * @returns {JSX.Element} Budget tracking and forecasting section
 */
export default function BudgetsTab() {
    return (
        // Container with provider-tab class for consistent tab styling
        <div className="provider-tab">
            {/* Section heading */}
            <h2>Budgets & Forecast</h2>

            {/* Content wrapper for budget components */}
            {/* Uses CSS class for grid/flex layout of child components */}
            <div className="budgets-content">
                {/* Budget utilization tracker */}
                {/* Shows current spend vs allocated budget for each provider */}
                <BudgetTracker/>

                {/* Cost forecasting chart */}
                {/* Displays projected costs based on historical trends */}
                <ForecastingChart/>
            </div>
        </div>
    );
}