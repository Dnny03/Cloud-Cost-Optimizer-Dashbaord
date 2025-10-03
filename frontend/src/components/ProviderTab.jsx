import React from 'react';
import { useMTDCosts, useLiveMetrics } from '../hooks/useCloudData';
import MetricsCard from './MetricsCard';
import CostsTable from './CostsTable';

export default function ProviderTab({ provider }) {
  // Fetch data for THIS provider
  const { data: mtdCosts, loading: costsLoading } = useMTDCosts(provider);
  const { data: liveMetrics, loading: metricsLoading } = useLiveMetrics(provider, 30000);

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
          icon="💻"
        />
        
        <MetricsCard
          title="Instances Monitored"
          value={liveMetrics?.instances_monitored}
          unit="VMs"
          loading={metricsLoading}
          icon="🖥️"
        />

        <MetricsCard
          title="MTD Total Cost"
          value={calculateTotal(mtdCosts)}
          unit="$"
          loading={costsLoading}
          icon="💰"
        />

        <MetricsCard
          title="Active Services"
          value={mtdCosts?.length}
          unit="services"
          loading={costsLoading}
          icon="⚙️"
        />
      </div>

      {/* Bottom Section: Costs Breakdown Table */}
      <div className="costs-section">
        <h3>Month-to-Date Costs by Service</h3>
        <CostsTable data={mtdCosts} loading={costsLoading} />
      </div>
    </div>
  );
}

// Helper to calculate total costs
function calculateTotal(costs) {
  if (!costs || costs.length === 0) return 0;
  return costs.reduce((sum, item) => sum + (item.cost || 0), 0).toFixed(2);
}