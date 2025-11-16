import React from 'react';
import { useMTDCosts, useLiveMetrics } from '../../../hooks/useCloudData.js';
import MetricsCard from '../../common/MetricsCard.jsx';
import CostsTable from '../../common/CostsTable.jsx';

export default function ProviderTab({ provider }) {
  // Validate provider prop
  if (!provider) {
    return (
      <div className="error" style={{ padding: '40px', textAlign: 'center' }}>
        Error: No provider specified
      </div>
    );
  }

  // Fetch data for THIS provider
  const { data: mtdCosts, loading: costsLoading, error: costsError } = useMTDCosts(provider);
  const { data: liveMetrics, loading: metricsLoading, error: metricsError } = useLiveMetrics(provider, 30000);

  // Show error if both data sources fail
  if (costsError && metricsError) {
    return (
      <div className="provider-tab">
        <h2>{provider.toUpperCase()} Dashboard</h2>
        <div className="error" style={{ 
          padding: '40px', 
          textAlign: 'center',
          background: 'rgba(239, 68, 68, 0.1)',
          borderRadius: '8px',
          border: '1px solid rgba(239, 68, 68, 0.3)'
        }}>
          <p>Failed to load provider data</p>
          <p style={{ fontSize: '14px', marginTop: '10px', color: '#94a3b8' }}>
            {costsError || metricsError}
          </p>
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
      </div>
    );
  }

  return (
    <div className="provider-tab">
      <h2>{provider.toUpperCase()} Dashboard</h2>

      {/* Top Row: Live Metrics Cards */}
      <div className="metrics-grid">
        <MetricsCard
          title="CPU Usage"
          value={liveMetrics?.cpu_percent}
          unit="%"
          loading={metricsLoading}
          error={metricsError}
          icon="💻"
        />
        
        <MetricsCard
          title="Instances Monitored"
          value={liveMetrics?.instances_monitored}
          unit=" VMs"
          loading={metricsLoading}
          error={metricsError}
          icon="🖥️"
        />

        <MetricsCard
          title="MTD Total Cost"
          value={calculateTotal(mtdCosts)}
          unit="$"
          loading={costsLoading}
          error={costsError}
          icon="💰"
        />

        <MetricsCard
          title="Active Services"
          value={Array.isArray(mtdCosts) ? mtdCosts.length : 0}
          unit=" services"
          loading={costsLoading}
          error={costsError}
          icon="⚙️"
        />
      </div>

      {/* Bottom Section: Costs Breakdown Table */}
      <div className="costs-section">
        <h3>Month-to-Date Costs by Service</h3>
        <CostsTable 
          data={mtdCosts} 
          loading={costsLoading} 
          error={costsError}
        />
      </div>
    </div>
  );
}

// Helper to calculate total costs with validation
function calculateTotal(costs) {
  if (!costs || !Array.isArray(costs) || costs.length === 0) return "0.00";
  
  const total = costs.reduce((sum, item) => {
    const cost = parseFloat(item?.cost) || 0;
    return sum + cost;
  }, 0);
  
  return total.toFixed(2);
}