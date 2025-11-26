import React from 'react';
import { useAnomalies } from '../../../hooks/useCloudData';

export default function AnomalyDetectionPanel() {
  const { data: anomalies, loading, error } = useAnomalies();

  if (loading) return <div className="loading"><div className="loading-spinner"></div>Loading anomalies...</div>;
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
    const classes = { critical: 'status-error', high: 'status-warning', medium: 'status-warning', low: 'status-healthy' };
    return classes[severity] || '';
  };

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-icon">🔍</span>
        <h4>Anomaly Detection <span className="anomaly-count">{anomalies.length} detected</span></h4>
      </div>

      <div className="anomalies-list">
        {anomalies.slice(0, 5).map(anomaly => (
          <div key={anomaly.id} className={`anomaly-item severity-${anomaly.severity}`}>
            <div className="anomaly-header">
              <span className="anomaly-provider">{anomaly.provider?.toUpperCase()}</span>
              <span className="anomaly-service">{anomaly.service}</span>
              <span className={`anomaly-severity ${getSeverityClass(anomaly.severity)}`}>{anomaly.severity}</span>
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
                <span className="stat-value status-error">+{anomaly.deviation_percent?.toFixed(1)}%</span>
              </div>
            </div>

            <div className="anomaly-recommendation">
              <span>💡</span> {anomaly.recommendation}
            </div>
          </div>
        ))}
      </div>

      <style>{`
        .anomaly-count { background: var(--danger); color: white; padding: 2px 10px; border-radius: 12px; font-size: 0.7rem; margin-left: 8px; font-weight: 500; }
        .anomalies-list { display: flex; flex-direction: column; gap: 12px; }
        .anomaly-item { padding: 14px; background: var(--bg-secondary); border-radius: 8px; border-left: 3px solid var(--border); }
        .anomaly-item.severity-critical { border-left-color: var(--danger); }
        .anomaly-item.severity-high { border-left-color: var(--warning); }
        .anomaly-item.severity-medium { border-left-color: var(--accent); }
        .anomaly-item.severity-low { border-left-color: var(--success); }
        .anomaly-header { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; }
        .anomaly-provider { background: var(--bg-tertiary); padding: 2px 8px; border-radius: 4px; font-size: 0.7rem; font-weight: 600; color: var(--text-muted); }
        .anomaly-service { font-weight: 600; color: var(--text-primary); flex: 1; }
        .anomaly-severity { padding: 2px 8px; border-radius: 4px; font-size: 0.7rem; font-weight: 600; text-transform: uppercase; }
        .anomaly-severity.status-error { background: rgba(239,68,68,0.1); color: var(--danger); }
        .anomaly-severity.status-warning { background: rgba(245,158,11,0.1); color: var(--warning); }
        .anomaly-severity.status-healthy { background: rgba(16,185,129,0.1); color: var(--success); }
        .anomaly-stats { display: flex; gap: 20px; margin-bottom: 10px; }
        .anomaly-stats .stat { display: flex; flex-direction: column; }
        .anomaly-stats .stat-label { font-size: 0.7rem; color: var(--text-muted); }
        .anomaly-stats .stat-value { font-size: 0.9rem; font-weight: 600; color: var(--text-primary); }
        .anomaly-stats .stat-value.highlight { color: var(--warning); }
        .anomaly-recommendation { font-size: 0.8rem; color: var(--text-secondary); background: rgba(79,70,229,0.05); padding: 8px 10px; border-radius: 6px; display: flex; align-items: flex-start; gap: 6px; }
      `}</style>
    </div>
  );
}