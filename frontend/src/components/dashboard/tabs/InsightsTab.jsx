// frontend/src/components/dashboard/insights/InsightsTab.jsx
/**
 * Insights Tab Component
 *
 * This component serves as the main container for the Insights & Alerts
 * section of the dashboard. It provides a centralized view of actionable
 * intelligence across all cloud providers.
 *
 * Layout:
 * - Top Row (side-by-side):
 *   - AlertsPanel: Active alerts with severity filtering
 *   - RecommendationsPanel: Cost optimization suggestions
 * - Bottom Row (full width):
 *   - AnomalyDetectionPanel: Detected cost anomalies
 *
 * The tab aggregates data from all configured providers (AWS, Azure, GCP)
 * to help users:
 * - Monitor and respond to active alerts
 * - Discover cost-saving opportunities
 * - Identify unusual spending patterns
 *
 * This is one of the main navigation tabs in the dashboard,
 * accessible via the tab bar alongside Overview, Budgets, and provider tabs.
 */

import React from 'react';

// Child components for insights functionality
import AlertsPanel from './AlertsPanel.jsx';              // Active alerts display
import AnomalyDetectionPanel from './AnomalyDetectionPanel.jsx';  // Cost anomaly detection
import RecommendationsPanel from './RecommendationsPanel.jsx';    // Optimization recommendations

/**
 * InsightsTab - Main container for insights, alerts, and recommendations
 *
 * @returns {JSX.Element} Insights section with alerts, recommendations, and anomalies
 */
export default function InsightsTab() {
    return (
        // Container with provider-tab class for consistent tab styling
        <div className="provider-tab">
            {/* Section heading */}
            <h2>Insights & Alerts</h2>

            {/* Top row: Alerts and Recommendations side by side */}
            {/* Uses CSS grid/flex layout for two-column display */}
            <div className="insights-top-row">
                {/* Left panel: Active alerts from all providers */}
                <div className="insights-panel">
                    <AlertsPanel/>
                </div>

                {/* Right panel: Cost optimization recommendations */}
                <div className="insights-panel">
                    <RecommendationsPanel/>
                </div>
            </div>

            {/* Bottom row: Anomaly detection spanning full width */}
            {/* Given more space as anomalies have detailed stats */}
            <div className="insights-bottom-row">
                <AnomalyDetectionPanel/>
            </div>
        </div>
    );
}