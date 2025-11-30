// frontend/src/components/dashboard/insights/AlertsPanel.jsx
/**
 * Alerts Panel Component
 *
 * This component displays a list of active alerts from all configured
 * cloud providers. It shows warnings, errors, and notifications that
 * require user attention.
 *
 * Features:
 * - Severity-based filtering (all, critical, high, warning, low)
 * - Unacknowledged alert badge showing new alerts count
 * - Color-coded severity indicators
 * - Relative time display (e.g., "2h ago", "3d ago")
 * - Visual distinction for unread/unacknowledged alerts
 * - Loading and error states
 *
 * Data fetched from the /api/alerts/all endpoint which aggregates
 * alerts from AWS, Azure, and GCP.
 *
 * Used in the Insights tab to provide a centralized view of
 * all cloud platform alerts.
 */

import React, {useState} from 'react';

// Custom hook for fetching aggregated alerts data from all providers
import {useAlerts} from '../../../hooks/useCloudData';

/**
 * AlertsPanel - Renders a filterable list of cloud provider alerts
 *
 * @returns {JSX.Element} Alert panel with filter buttons and alert list
 */
export default function AlertsPanel() {
    // Fetch alerts data using custom hook
    // Returns aggregated alerts from all configured cloud providers
    const {data, loading, error} = useAlerts();

    // Filter state for severity-based filtering
    // Options: 'all', 'critical', 'high', 'warning', 'low'
    const [filter, setFilter] = useState('all');

    // =====================
    // Loading State
    // =====================
    if (loading) return <div className="loading">
        <div className="loading-spinner"></div>
        Loading alerts...</div>;

    // =====================
    // Error State
    // =====================
    if (error) return <div className="error">Failed to load alerts</div>;

    // =====================
    // Data Extraction
    // =====================
    // Extract alerts array and metadata from API response
    // Use defaults to handle missing data gracefully
    const alerts = data?.alerts || [];
    const severityCounts = data?.severity_counts || {};  // {critical: 2, high: 5, ...}
    const unacknowledgedCount = data?.unacknowledged_count || 0;  // New/unread alerts

    // Apply severity filter to alerts list
    // 'all' shows everything, other values filter by severity field
    const filteredAlerts = filter === 'all' ? alerts : alerts.filter(a => a.severity === filter);

    /**
     * Map severity level to CSS class for color styling
     *
     * @param {string} severity - Alert severity level
     * @returns {string} CSS class name for styling
     */
    const getSeverityClass = (severity) => {
        const classes = {
            critical: 'status-error',   // Red - immediate attention required
            high: 'status-warning',     // Orange/yellow - important
            warning: 'status-warning',  // Orange/yellow - notable
            low: 'status-healthy'       // Green - informational
        };
        return classes[severity] || '';
    };

    /**
     * Format ISO timestamp to relative time string
     *
     * Converts timestamps to human-readable relative times:
     * - Less than 1 hour: "Just now"
     * - Less than 24 hours: "Xh ago"
     * - 24+ hours: "Xd ago"
     *
     * @param {string} isoString - ISO 8601 timestamp
     * @returns {string} Relative time string
     */
    const formatTime = (isoString) => {
        const date = new Date(isoString);
        const diffHours = Math.floor((new Date() - date) / (1000 * 60 * 60));
        if (diffHours < 1) return 'Just now';
        if (diffHours < 24) return `${diffHours}h ago`;
        return `${Math.floor(diffHours / 24)}d ago`;
    };

    // =====================
    // Render
    // =====================
    return (
        <div className="card">
            {/* Card header with icon, title, and new alerts badge */}
            <div className="card-header">
                <span className="card-icon">🔔</span>
                <h4>Alerts {unacknowledgedCount > 0 &&
                    // Badge showing count of unacknowledged/new alerts
                    <span className="alert-badge">{unacknowledgedCount} new</span>}</h4>
            </div>

            {/* Severity filter buttons */}
            {/* Allows filtering alerts by severity level */}
            <div className="filter-buttons">
                {['all', 'critical', 'high', 'warning', 'low'].map(f => (
                    <button key={f} className={`btn btn-secondary ${filter === f ? 'active' : ''}`}
                            onClick={() => setFilter(f)}>
                        {/* Show count in parentheses for each filter option */}
                        {f === 'all' ? `All (${alerts.length})` : `${f} (${severityCounts[f] || 0})`}
                    </button>
                ))}
            </div>

            {/* Alerts list container */}
            <div className="alerts-list">
                {filteredAlerts.length === 0 ? (
                    // Empty state when no alerts match filter
                    <div className="no-data">No alerts</div>
                ) : (
                    // Render up to 5 alerts (slice limits display)
                    filteredAlerts.slice(0, 5).map(alert => (
                        // Alert item with conditional 'unread' class for unacknowledged alerts
                        <div key={alert.id} className={`alert-item ${!alert.acknowledged ? 'unread' : ''}`}>
                            {/* Alert header with severity, provider, and time */}
                            <div className="alert-header">
                                {/* Severity badge with color-coded class */}
                                <span
                                    className={`alert-severity ${getSeverityClass(alert.severity)}`}>{alert.severity}</span>
                                {/* Cloud provider name (AWS, AZURE, GCP) */}
                                <span className="alert-provider">{alert.provider?.toUpperCase()}</span>
                                {/* Relative time since alert was created */}
                                <span className="alert-time">{formatTime(alert.created_at)}</span>
                            </div>
                            {/* Alert title - brief description */}
                            <div className="alert-title">{alert.title}</div>
                            {/* Alert message - detailed information */}
                            <div className="alert-message">{alert.message}</div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}