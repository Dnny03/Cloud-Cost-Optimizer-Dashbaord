import React from 'react';
import {useAnomalies} from '../../../hooks/useCloudData';

export default function AnomalyDetectionPanel() {
    const {data: anomalies, loading, error} = useAnomalies();

    if (loading) return <div className="loading">
        <div className="loading-spinner"></div>
        Loading anomalies...</div>;
    if (error) return <div className="error">Failed to load anomalies</div>;

    if (!anomalies || anomalies.length === 0) {
        return (
            <div className="card">
                <div className="card-header">
                    <span className="card-icon">🔍</span>
                    <h4>Anomaly Detection</h4>
                </div>
                <div className="no-data">✅ No anomalies detected</div>
            </div>
        );
    }

    const getSeverityClass = (severity) => {
        const classes = {
            critical: 'status-error',
            high: 'status-warning',
            medium: 'status-warning',
            low: 'status-healthy'
        };
        return classes[severity] || '';
    };

    return (
        <div className="card">
            <div className="card-header">
                <span className="card-icon">🔍</span>
                <h4>Anomaly Detection <span className="anomaly-count">{anomalies.length} detected</span></h4>
            </div>

            <div className="anomalies-list">
                {anomalies.map(anomaly => (
                    <div key={anomaly.id} className={`anomaly-item severity-${anomaly.severity}`}>
                        <div className="anomaly-header">
                            <span className="anomaly-provider">{anomaly.provider?.toUpperCase()}</span>
                            <span className="anomaly-service">{anomaly.service}</span>
                            <span
                                className={`anomaly-severity ${getSeverityClass(anomaly.severity)}`}>{anomaly.severity}</span>
                        </div>

                        <div className="anomaly-stats">
                            <div className="stat">
                                <span className="stat-label">Expected</span>
                                <span className="stat-value">${anomaly.expected_cost?.toFixed(2)}</span>
                            </div>
                            <div className="stat">
                                <span className="stat-label">Actual</span>
                                <span className="stat-value highlight">${anomaly.actual_cost?.toFixed(2)}</span>
                            </div>
                            <div className="stat">
                                <span className="stat-label">Deviation</span>
                                <span
                                    className="stat-value status-error">+{anomaly.deviation_percent?.toFixed(1)}%</span>
                            </div>
                        </div>

                        <div className="anomaly-recommendation">
                            <span>💡</span> {anomaly.recommendation}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}