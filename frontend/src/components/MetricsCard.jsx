import React from 'react';

export default function MetricsCard({ title, value, unit, loading, icon }) {
  return (
    <div className="metrics-card">
      <div className="card-header">
        <span className="card-icon">{icon}</span>
        <h4>{title}</h4>
      </div>
      <div className="card-body">
        {loading ? (
          <div className="loading-spinner">Loading...</div>
        ) : (
          <div className="metric-value">
            {value !== null && value !== undefined ? (
              <>
                <span className="value">{value}</span>
                <span className="unit">{unit}</span>
              </>
            ) : (
              <span className="no-data">No data</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}