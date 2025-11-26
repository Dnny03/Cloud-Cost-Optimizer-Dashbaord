import React, {useState} from 'react';
import {useAlerts} from '../../../hooks/useCloudData';

export default function AlertsPanel() {
    const {data, loading, error} = useAlerts();
    const [filter, setFilter] = useState('all');

    if (loading) return <div className="loading">
        <div className="loading-spinner"></div>
        Loading alerts...</div>;
    if (error) return <div className="error">Failed to load alerts</div>;

    const alerts = data?.alerts || [];
    const severityCounts = data?.severity_counts || {};
    const unacknowledgedCount = data?.unacknowledged_count || 0;

    const filteredAlerts = filter === 'all' ? alerts : alerts.filter(a => a.severity === filter);

    const getSeverityClass = (severity) => {
        const classes = {
            critical: 'status-error',
            high: 'status-warning',
            warning: 'status-warning',
            low: 'status-healthy'
        };
        return classes[severity] || '';
    };

    const formatTime = (isoString) => {
        const date = new Date(isoString);
        const diffHours = Math.floor((new Date() - date) / (1000 * 60 * 60));
        if (diffHours < 1) return 'Just now';
        if (diffHours < 24) return `${diffHours}h ago`;
        return `${Math.floor(diffHours / 24)}d ago`;
    };

    return (
        <div className="card">
            <div className="card-header">
                <span className="card-icon">🔔</span>
                <h4>Alerts {unacknowledgedCount > 0 &&
                    <span className="alert-badge">{unacknowledgedCount} new</span>}</h4>
            </div>

            <div className="filter-buttons">
                {['all', 'critical', 'high', 'warning', 'low'].map(f => (
                    <button key={f} className={`btn btn-secondary ${filter === f ? 'active' : ''}`}
                            onClick={() => setFilter(f)}>
                        {f === 'all' ? `All (${alerts.length})` : `${f} (${severityCounts[f] || 0})`}
                    </button>
                ))}
            </div>

            <div className="alerts-list">
                {filteredAlerts.length === 0 ? (
                    <div className="no-data">No alerts</div>
                ) : (
                    filteredAlerts.slice(0, 5).map(alert => (
                        <div key={alert.id} className={`alert-item ${!alert.acknowledged ? 'unread' : ''}`}>
                            <div className="alert-header">
                                <span
                                    className={`alert-severity ${getSeverityClass(alert.severity)}`}>{alert.severity}</span>
                                <span className="alert-provider">{alert.provider?.toUpperCase()}</span>
                                <span className="alert-time">{formatTime(alert.created_at)}</span>
                            </div>
                            <div className="alert-title">{alert.title}</div>
                            <div className="alert-message">{alert.message}</div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}