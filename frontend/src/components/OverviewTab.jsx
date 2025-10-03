import { useState, useEffect } from 'react';
import api from '../services/api';

export default function OverviewTab() {
  const [summary, setSummary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await api.getCostsSummary();  // Changed this line
        setSummary(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);
  
  if (loading) return <div className="loading">Loading overview...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  const totalSpend = summary
    .filter(p => p.mtd_cost)
    .reduce((sum, p) => sum + p.mtd_cost, 0);

  const activeProviders = summary.filter(p => p.status === 'active').length;

  return (
    <div className="provider-tab">
      <h2>Multi-Cloud Overview</h2>

      {/* Overall Stats */}
      <div className="metrics-grid">
        <div className="metrics-card">
          <div className="card-header">
            <span className="card-icon">💰</span>
            <h4>Total MTD Spend</h4>
          </div>
          <div className="card-body">
            <div className="metric-value">
              <span className="value">${totalSpend.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="metrics-card">
          <div className="card-header">
            <span className="card-icon">☁️</span>
            <h4>Active Providers</h4>
          </div>
          <div className="card-body">
            <div className="metric-value">
              <span className="value">{activeProviders}</span>
              <span className="unit">providers</span>
            </div>
          </div>
        </div>

        <div className="metrics-card">
          <div className="card-header">
            <span className="card-icon">✅</span>
            <h4>Status</h4>
          </div>
          <div className="card-body">
            <div className="metric-value">
              <span className="value" style={{ color: '#4ade80', fontSize: '1.5rem' }}>Healthy</span>
            </div>
          </div>
        </div>
      </div>

      {/* Provider Breakdown */}
      <div className="costs-section">
        <h3>Providers</h3>
        <div className="metrics-grid">
          {summary.map((provider) => (
            <div key={provider.provider} className="metrics-card">
              <div className="card-header">
                <span className="card-icon">
                  {provider.provider === 'gcp' && '☁️'}
                  {provider.provider === 'aws' && '🟠'}
                  {provider.provider === 'azure' && '🔷'}
                </span>
                <h4>{provider.provider.toUpperCase()}</h4>
              </div>
              <div className="card-body">
                {provider.status === 'active' ? (
                  <>
                    <div className="metric-value">
                      <span className="value">${provider.mtd_cost?.toFixed(2) || '0.00'}</span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '8px' }}>
                      MTD Cost
                    </div>
                  </>
                ) : (
                  <div className="error" style={{ fontSize: '14px' }}>
                    {provider.error || 'Not configured'}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}