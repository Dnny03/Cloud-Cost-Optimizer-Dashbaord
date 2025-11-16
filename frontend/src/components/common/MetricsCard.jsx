import React from 'react';

export default function MetricsCard({ 
  title, 
  value, 
  unit = '', 
  loading = false, 
  error = null, 
  icon = '📊' 
}) {
  return (
    <div className="metrics-card" role="region" aria-label={title}>
      <div className="card-header">
        <span className="card-icon" aria-hidden="true">{icon}</span>
        <h4>{title}</h4>
      </div>
      <div className="card-body">
        {loading ? (
          <div className="loading-spinner" aria-live="polite" aria-busy="true">
            Loading...
          </div>
        ) : error ? (
          <div className="error" style={{ fontSize: '14px', color: '#ef4444' }}>
            <span className="no-data">Error loading data</span>
          </div>
        ) : (
          <div className="metric-value">
            {value !== null && value !== undefined ? (
              <>
                <span className="value">{formatValue(value)}</span>
                {unit && <span className="unit">{unit}</span>}
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

// Helper to format values safely
function formatValue(value) {
  // Handle different value types
  if (typeof value === 'number') {
    // Check if it's a decimal number that should be formatted
    if (value % 1 !== 0) {
      return value.toFixed(2);
    }
    return value.toString();
  }
  
  if (typeof value === 'string') {
    // If it's already a formatted string (like from calculateTotal), return as is
    return value;
  }
  
  // For any other type, convert to string
  return String(value);
}