// frontend/src/components/dashboard/providers/ProviderTab.jsx
/**
 * Provider Tab Component
 *
 * This component displays a detailed dashboard for a specific cloud
 * provider (AWS, Azure, or GCP). It shows real-time metrics and
 * cost breakdowns for the selected provider.
 *
 * Features:
 * - Live CPU usage metrics with auto-refresh
 * - Instance count monitoring
 * - Month-to-date total cost
 * - Active services count
 * - Detailed cost breakdown table by service
 * - Error handling with retry functionality
 * - Loading states for each data source
 *
 * Data Sources:
 * - useMTDCosts: Fetches month-to-date costs from /api/costs/mtd/<provider>
 * - useLiveMetrics: Fetches live metrics from /api/metrics/live/<provider>
 *                   with 30-second auto-refresh interval
 *
 * Used when user clicks on a specific provider tab (AWS, Azure, GCP)
 * in the dashboard navigation.
 */

import React from 'react';

// Custom hooks for fetching provider-specific data
import {useMTDCosts, useLiveMetrics} from '../../../hooks/useCloudData.js';

// Reusable UI components
import MetricsCard from '../../common/MetricsCard.jsx';  // Single metric display card
import CostsTable from '../../common/CostsTable.jsx';    // Cost breakdown table

/**
 * ProviderTab - Renders a provider-specific dashboard
 *
 * @param {Object} props - Component props
 * @param {string} props.provider - Provider identifier ("aws", "azure", or "gcp")
 *
 * @returns {JSX.Element} Provider dashboard with metrics and costs
 *
 * @example
 * <ProviderTab provider="aws" />
 */
export default function ProviderTab({provider}) {
    // =====================
    // Props Validation
    // =====================
    // Guard against missing provider prop
    if (!provider) {
        return (
            <div className="error" style={{padding: '40px', textAlign: 'center'}}>
                Error: No provider specified
            </div>
        );
    }

    // =====================
    // Data Fetching
    // =====================

    // Fetch month-to-date costs for this specific provider
    // Returns array of cost items: [{service, project, cost}, ...]
    const {data: mtdCosts, loading: costsLoading, error: costsError} = useMTDCosts(provider);

    // Fetch live metrics with 30-second auto-refresh interval
    // Returns: {cpu_percent, instances_monitored, ...}
    const {data: liveMetrics, loading: metricsLoading, error: metricsError} = useLiveMetrics(provider, 30000);

    // =====================
    // Error State
    // =====================
    // Show error UI only if BOTH data sources fail
    // Allows partial display if one source is available
    if (costsError && metricsError) {
        return (
            <div className="provider-tab">
                <h2>{provider.toUpperCase()} Dashboard</h2>
                <div className="error" style={{
                    padding: '40px',
                    textAlign: 'center',
                    background: 'rgba(239, 68, 68, 0.1)',  // Light red background
                    borderRadius: '8px',
                    border: '1px solid rgba(239, 68, 68, 0.3)'  // Red border
                }}>
                    <p>Failed to load provider data</p>
                    {/* Show specific error message */}
                    <p style={{fontSize: '14px', marginTop: '10px', color: '#94a3b8'}}>
                        {costsError || metricsError}
                    </p>
                    {/* Retry button reloads the page */}
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

    // =====================
    // Render Dashboard
    // =====================
    return (
        <div className="provider-tab">
            {/* Provider name in header (uppercase) */}
            <h2>{provider.toUpperCase()} Dashboard</h2>

            {/* Top Row: Live Metrics Cards */}
            {/* Four cards in a responsive grid layout */}
            <div className="metrics-grid">
                {/* CPU Usage - Live metric with percentage */}
                <MetricsCard
                    title="CPU Usage"
                    value={liveMetrics?.cpu_percent}
                    unit="%"
                    loading={metricsLoading}
                    error={metricsError}
                    icon="💻"
                />

                {/* Instances Monitored - Count of VMs being tracked */}
                <MetricsCard
                    title="Instances Monitored"
                    value={liveMetrics?.instances_monitored}
                    unit=" VMs"
                    loading={metricsLoading}
                    error={metricsError}
                    icon="🖥️"
                />

                {/* MTD Total Cost - Calculated from costs array */}
                <MetricsCard
                    title="MTD Total Cost"
                    value={calculateTotal(mtdCosts)}
                    unit="$"
                    loading={costsLoading}
                    error={costsError}
                    icon="💰"
                />

                {/* Active Services - Count of services with costs */}
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
            {/* Shows detailed service-by-service costs */}
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

/**
 * Calculate total cost from an array of cost items
 *
 * Safely handles invalid or missing data by:
 * - Returning "0.00" for null, undefined, or empty arrays
 * - Parsing each cost value to float
 * - Treating invalid/NaN values as 0
 *
 * @param {Array} costs - Array of cost items with 'cost' property
 *                        Format: [{cost: 123.45}, {cost: 67.89}, ...]
 * @returns {string} Total cost formatted to 2 decimal places
 *
 * @example
 * calculateTotal([{cost: 100}, {cost: 50.25}])  // Returns "150.25"
 * calculateTotal(null)                           // Returns "0.00"
 * calculateTotal([])                             // Returns "0.00"
 */
function calculateTotal(costs) {
    // Return zero for invalid input
    if (!costs || !Array.isArray(costs) || costs.length === 0) return "0.00";

    // Sum all valid cost values
    const total = costs.reduce((sum, item) => {
        const cost = parseFloat(item?.cost) || 0;  // Parse with fallback to 0
        return sum + cost;
    }, 0);

    // Format to 2 decimal places for currency display
    return total.toFixed(2);
}