// frontend/src/components/dashboard/insights/AnomalyDetectionPanel.jsx
/**
 * Anomaly Detection Panel Component
 *
 * This component displays detected cost anomalies across all configured
 * cloud providers. Anomalies are unusual spending patterns that deviate
 * significantly from expected costs, potentially indicating issues like
 * runaway resources, misconfigurations, or unexpected usage spikes.
 *
 * Features:
 * - Displays all detected anomalies (no pagination limit)
 * - Severity-based visual styling (critical, high, medium, low)
 * - Expected vs actual cost comparison
 * - Percentage deviation highlighting
 * - Actionable recommendations for each anomaly
 * - Empty state when no anomalies detected
 * - Loading and error states
 *
 * Data fetched from the /api/anomalies/all endpoint which aggregates
 * anomalies from AWS, Azure, and GCP, sorted by deviation percentage.
 *
 * Used in the Insights tab to help users identify and address
 * unexpected cost increases across their cloud infrastructure.
 */

import React from 'react';

// Custom hook for fetching aggregated anomaly data from all providers
import {useAnomalies} from '../../../hooks/useCloudData';

/**
 * AnomalyDetectionPanel - Renders a list of detected cost anomalies
 *
 * @returns {JSX.Element} Anomaly panel with list of detected anomalies
 */
export default function AnomalyDetectionPanel() {
    // Fetch anomalies data using custom hook
    // Destructure with alias: data renamed to anomalies for clarity
    const {data: anomalies, loading, error} = useAnomalies();

    // =====================
    // Loading State
    // =====================
    if (loading) return <div className="loading">
        <div className="loading-spinner"></div>
        Loading anomalies...</div>;

    // =====================
    // Error State
    // =====================
    if (error) return <div className="error">Failed to load anomalies</div>;

    // =====================
    // Empty State
    // =====================
    // Show positive message when no anomalies are detected
    // This is a good state - means costs are within expected ranges
    if (!anomalies || anomalies.length === 0) {
        return (
            <div className="card">
                <div className="card-header">
                    <span className="card-icon">🔍</span>
                    <h4>Anomaly Detection</h4>
                </div>
                {/* Green checkmark indicates healthy state */}
                <div className="no-data">✅ No anomalies detected</div>
            </div>
        );
    }

    /**
     * Map severity level to CSS class for color styling
     *
     * Severity levels indicate urgency of the anomaly:
     * - critical: Severe deviation, immediate attention required
     * - high: Significant deviation, should investigate soon
     * - medium: Notable deviation, worth reviewing
     * - low: Minor deviation, informational
     *
     * @param {string} severity - Anomaly severity level
     * @returns {string} CSS class name for styling
     */
    const getSeverityClass = (severity) => {
        const classes = {
            critical: 'status-error',   // Red - immediate attention
            high: 'status-warning',     // Orange/yellow - important
            medium: 'status-warning',   // Orange/yellow - notable
            low: 'status-healthy'       // Green - minor
        };
        return classes[severity] || '';
    };

    // =====================
    // Render Anomalies List
    // =====================
    return (
        <div className="card">
            {/* Card header with icon, title, and anomaly count badge */}
            <div className="card-header">
                <span className="card-icon">🔍</span>
                <h4>Anomaly Detection <span className="anomaly-count">{anomalies.length} detected</span></h4>
            </div>

            {/* Scrollable list of anomaly items */}
            <div className="anomalies-list">
                {/* Map through all anomalies - no slice limit, shows all */}
                {anomalies.map(anomaly => (
                    // Anomaly item with severity-based border color class
                    <div key={anomaly.id} className={`anomaly-item severity-${anomaly.severity}`}>
                        {/* Anomaly header with provider, service, and severity */}
                        <div className="anomaly-header">
                            {/* Cloud provider badge (AWS, AZURE, GCP) */}
                            <span className="anomaly-provider">{anomaly.provider?.toUpperCase()}</span>
                            {/* Affected service name (e.g., EC2, S3, Cloud Functions) */}
                            <span className="anomaly-service">{anomaly.service}</span>
                            {/* Severity badge with color-coded class */}
                            <span
                                className={`anomaly-severity ${getSeverityClass(anomaly.severity)}`}>{anomaly.severity}</span>
                        </div>

                        {/* Cost comparison statistics */}
                        <div className="anomaly-stats">
                            {/* Expected cost based on historical patterns */}
                            <div className="stat">
                                <span className="stat-label">Expected</span>
                                <span className="stat-value">${anomaly.expected_cost?.toFixed(2)}</span>
                            </div>
                            {/* Actual cost that triggered the anomaly */}
                            {/* 'highlight' class emphasizes this is the problematic value */}
                            <div className="stat">
                                <span className="stat-label">Actual</span>
                                <span className="stat-value highlight">${anomaly.actual_cost?.toFixed(2)}</span>
                            </div>
                            {/* Percentage deviation from expected */}
                            {/* Always shown as positive with + prefix */}
                            <div className="stat">
                                <span className="stat-label">Deviation</span>
                                <span
                                    className="stat-value status-error">+{anomaly.deviation_percent?.toFixed(1)}%</span>
                            </div>
                        </div>

                        {/* Actionable recommendation for addressing the anomaly */}
                        {/* Lightbulb emoji indicates this is a suggestion */}
                        <div className="anomaly-recommendation">
                            <span>💡</span> {anomaly.recommendation}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}