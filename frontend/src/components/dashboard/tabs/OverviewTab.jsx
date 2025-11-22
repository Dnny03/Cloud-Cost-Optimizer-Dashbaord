import React, { useState, useEffect, useRef } from 'react';
import SpendingPieChart from '../charts/SpendingPieChart.jsx';
import api from '../../../services/api.js';

export default function OverviewTab() {
  const [summary, setSummary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    // Reset mounted ref
    mountedRef.current = true;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await api.getCostsSummary();

        // Only update state if component is still mounted
        if (mountedRef.current) {
          // Validate data structure
          if (Array.isArray(data)) {
            setSummary(data);
          } else {
            console.error('Invalid data format received:', data);
            setError('Invalid data format received from server');
          }
        }
      } catch (err) {
        if (mountedRef.current) {
          setError(err.message || 'Failed to load overview data');
        }
      } finally {
        if (mountedRef.current) {
          setLoading(false);
        }
      }
    };

    fetchData();

    // Cleanup function
    return () => {
      mountedRef.current = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="loading" style={{ padding: '40px', textAlign: 'center' }}>
        <div className="loading-spinner">Loading overview...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error" style={{
        padding: '40px',
        textAlign: 'center',
        color: '#ef4444'
      }}>
        <p>Error: {error}</p>
        <button
          onClick={() => window.location.reload()}
          style={{
            marginTop: '20px',
            padding: '10px 20px',
            borderRadius: '8px',
            border: 'none',
            background: '#3b82f6',
            color: 'white',
            cursor: 'pointer'
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  // Calculate totals safely
  const totalSpend = summary
    .filter(p => p && typeof p.mtd_cost === 'number')
    .reduce((sum, p) => sum + p.mtd_cost, 0);

  const activeProviders = summary.filter(p => p && p.status === 'active').length;

  // Determine overall health status
  const getHealthStatus = () => {
    if (!summary || summary.length === 0) return { text: 'No Data', color: '#94a3b8' };
    if (error) return { text: 'Error', color: '#ef4444' };
    const hasErrors = summary.some(p => p.error);
    if (hasErrors) return { text: 'Partial', color: '#f59e0b' };
    return { text: 'Healthy', color: '#4ade80' };
  };

  const healthStatus = getHealthStatus();

  return (
    <div className="provider-tab">
      <h2>Multi-Cloud Overview</h2>

      {/* Overall Stats */}
      <div className="metrics-grid">
        <div className="metrics-card">
          <div className="card-header">
            <span className="card-icon" aria-hidden="true">💰</span>
            <h4>Total MTD Spend</h4>
          </div>
          <div className="card-body">
            <div className="metric-value">
              <span className="value">${totalSpend.toFixed(2)}</span>
            </div>
            {summary && summary.length > 0 && (
              <SpendingPieChart data={summary} />
            )}
          </div>
        </div>

        <div className="metrics-card">
          <div className="card-header">
            <span className="card-icon" aria-hidden="true">☁️</span>
            <h4>Active Providers</h4>
          </div>
          <div className="card-body">
            <div className="metric-value">
              <span className="value">{activeProviders}</span>
              <span className="unit"> provider{activeProviders !== 1 ? 's' : ''}</span>
            </div>
          </div>
        </div>

        <div className="metrics-card">
          <div className="card-header">
            <span className="card-icon" aria-hidden="true">✅</span>
            <h4>Status</h4>
          </div>
          <div className="card-body">
            <div className="metric-value">
              <span
                className="value"
                style={{
                  color: healthStatus.color,
                  fontSize: '1.5rem'
                }}
              >
                {healthStatus.text}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Provider Breakdown */}
      <div className="costs-section">
        <h3>Providers</h3>
        {summary.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8' }}>
            No providers configured
          </div>
        ) : (
          <div className="metrics-grid">
            {/* Sort providers to match pie chart order: AWS, AZURE, GCP */}
            {[...summary]
              .sort((a, b) => {
                const order = { aws: 1, azure: 2, gcp: 3 };
                const aKey = a.provider?.toLowerCase();
                const bKey = b.provider?.toLowerCase();
                return (order[aKey] || 999) - (order[bKey] || 999);
              })
              .map((provider) => {
                if (!provider || !provider.provider) return null;

                return (
                  <div key={provider.provider} className="metrics-card">
                    <div className="card-header">
                      <span className="card-icon" aria-hidden="true">
                        {getProviderIcon(provider.provider)}
                      </span>
                      <h4>{provider.provider.toUpperCase()}</h4>
                    </div>
                    <div className="card-body">
                      {provider.status === 'active' ? (
                        <>
                          <div className="metric-value">
                            <span className="value">
                              ${typeof provider.mtd_cost === 'number'
                                ? provider.mtd_cost.toFixed(2)
                                : '0.00'}
                            </span>
                          </div>
                          <div style={{
                            fontSize: '12px',
                            color: '#94a3b8',
                            marginTop: '8px'
                          }}>
                            MTD Cost
                          </div>
                        </>
                      ) : (
                        <div className="error" style={{ fontSize: '14px', color: '#ef4444' }}>
                          {provider.error || 'Not configured'}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
}

// Helper to return an emoji icon based on provider name
function getProviderIcon(provider) {
  const icons = {
    gcp: '☁️',
    aws: '🟠',
    azure: '🔷'
  };
  return icons[provider?.toLowerCase()] || '☁️';
}