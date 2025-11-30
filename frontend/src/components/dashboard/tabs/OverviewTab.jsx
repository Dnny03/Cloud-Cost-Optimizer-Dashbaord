// frontend/src/components/dashboard/overview/OverviewTab.jsx
/**
 * Overview Tab Component
 *
 * This component serves as the main landing view of the dashboard,
 * providing a high-level summary of cloud spending across all
 * configured providers (AWS, Azure, GCP).
 *
 * Features:
 * - Total month-to-date (MTD) spend with pie chart visualization
 * - Active provider count
 * - Overall health status indicator
 * - Individual provider cost cards
 * - Services breakdown component
 * - Loading and error states with retry functionality
 *
 * Data Flow:
 * 1. Fetches cost summary from /api/costs/summary endpoint
 * 2. Calculates aggregate metrics (total spend, active count)
 * 3. Determines health status based on provider states
 * 4. Renders metric cards and provider breakdown
 *
 * This is the default tab shown when users access the dashboard.
 */

import React, {useState, useEffect, useRef} from 'react';

// Child components
import SpendingPieChart from '../charts/SpendingPieChart.jsx';  // Pie chart for spend distribution
import ServicesBreakdown from './ServicesBreakdown.jsx';        // Hierarchical service costs

// API service for backend communication
import api from '../../../services/api.js';

/**
 * OverviewTab - Main dashboard overview with aggregate cloud metrics
 *
 * @returns {JSX.Element} Overview section with metrics, provider cards, and services
 */
export default function OverviewTab() {
    // =====================
    // State Management
    // =====================

    // Array of provider summary objects from API
    // Format: [{provider: "aws", mtd_cost: 1234.56, status: "active"}, ...]
    const [summary, setSummary] = useState([]);

    // Loading state for initial data fetch
    const [loading, setLoading] = useState(true);

    // Error message if data fetch fails
    const [error, setError] = useState(null);

    // Ref to track component mount status
    // Prevents state updates after unmount (memory leak prevention)
    const mountedRef = useRef(true);

    // =====================
    // Data Fetching
    // =====================
    useEffect(() => {
        // Mark component as mounted
        mountedRef.current = true;

        /**
         * Fetch cost summary data from the API
         * Handles loading states and errors with mount checking
         */
        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);

                // Fetch aggregated cost summary from all providers
                const data = await api.getCostsSummary();

                // Only update state if component is still mounted
                if (mountedRef.current) {
                    if (Array.isArray(data)) {
                        setSummary(data);
                    } else {
                        // Handle unexpected response format
                        setError('Invalid data format received from server');
                    }
                }
            } catch (err) {
                // Only set error if component is still mounted
                if (mountedRef.current) {
                    setError(err.message || 'Failed to load overview data');
                }
            } finally {
                // Always clear loading state if mounted
                if (mountedRef.current) {
                    setLoading(false);
                }
            }
        };

        fetchData();

        // Cleanup: mark as unmounted to prevent state updates
        return () => {
            mountedRef.current = false;
        };
    }, []);  // Empty dependency array = run once on mount

    // =====================
    // Loading State
    // =====================
    if (loading) {
        return (
            <div className="loading" style={{padding: '40px', textAlign: 'center'}}>
                <div className="loading-spinner">Loading overview...</div>
            </div>
        );
    }

    // =====================
    // Error State
    // =====================
    // Shows error message with retry button that reloads the page
    if (error) {
        return (
            <div className="error" style={{padding: '40px', textAlign: 'center', color: '#ef4444'}}>
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

    // =====================
    // Calculated Metrics
    // =====================

    // Calculate total MTD spend across all providers
    // Filters out invalid entries and sums mtd_cost values
    const totalSpend = summary
        .filter(p => p && typeof p.mtd_cost === 'number')
        .reduce((sum, p) => sum + p.mtd_cost, 0);

    // Count providers with 'active' status
    const activeProviders = summary.filter(p => p && p.status === 'active').length;

    /**
     * Determine overall health status based on provider states
     *
     * Status levels:
     * - Healthy (green): All providers operational
     * - Partial (orange): Some providers have errors
     * - Error (red): Error state is set
     * - No Data (gray): No provider data available
     *
     * @returns {Object} Status object with text and color properties
     */
    const getHealthStatus = () => {
        if (!summary || summary.length === 0) return {text: 'No Data', color: '#94a3b8'};
        if (error) return {text: 'Error', color: '#ef4444'};
        const hasErrors = summary.some(p => p.error);
        if (hasErrors) return {text: 'Partial', color: '#f59e0b'};
        return {text: 'Healthy', color: '#4ade80'};
    };

    const healthStatus = getHealthStatus();

    // =====================
    // Render
    // =====================
    return (
        <div className="provider-tab">
            {/* Section heading */}
            <h2>Multi-Cloud Overview</h2>

            {/* Overall Stats - Three metric cards in a grid */}
            <div className="metrics-grid">
                {/* Total MTD Spend Card with Pie Chart */}
                <div className="metrics-card">
                    <div className="card-header">
                        <span className="card-icon">💰</span>
                        <h4>Total MTD Spend</h4>
                    </div>
                    <div className="card-body">
                        {/* Total spend value */}
                        <div className="metric-value">
                            <span className="value">${totalSpend.toFixed(2)}</span>
                        </div>
                        {/* Pie chart showing spend distribution by provider */}
                        {summary && summary.length > 0 && (
                            <SpendingPieChart data={summary}/>
                        )}
                    </div>
                </div>

                {/* Active Providers Count Card */}
                <div className="metrics-card">
                    <div className="card-header">
                        <span className="card-icon">☁️</span>
                        <h4>Active Providers</h4>
                    </div>
                    <div className="card-body">
                        <div className="metric-value">
                            <span className="value">{activeProviders}</span>
                            {/* Pluralize "provider" based on count */}
                            <span className="unit"> provider{activeProviders !== 1 ? 's' : ''}</span>
                        </div>
                    </div>
                </div>

                {/* Health Status Card */}
                <div className="metrics-card">
                    <div className="card-header">
                        <span className="card-icon">✅</span>
                        <h4>Status</h4>
                    </div>
                    <div className="card-body">
                        <div className="metric-value">
                            {/* Status text with dynamic color based on health */}
              <span className="value" style={{color: healthStatus.color, fontSize: '1.5rem'}}>
                {healthStatus.text}
              </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Provider Breakdown Section */}
            <div className="costs-section">
                <h3>Providers</h3>
                {summary.length === 0 ? (
                    // Empty state when no providers configured
                    <div style={{padding: '20px', textAlign: 'center', color: '#94a3b8'}}>
                        No providers configured
                    </div>
                ) : (
                    // Grid of individual provider cards
                    <div className="metrics-grid">
                        {/* Sort providers in consistent order: AWS, Azure, GCP */}
                        {[...summary]
                            .sort((a, b) => {
                                const order = {aws: 1, azure: 2, gcp: 3};
                                return (order[a.provider?.toLowerCase()] || 999) - (order[b.provider?.toLowerCase()] || 999);
                            })
                            .map((provider) => {
                                // Skip invalid provider entries
                                if (!provider || !provider.provider) return null;
                                return (
                                    <div key={provider.provider} className="metrics-card">
                                        <div className="card-header">
                                            {/* Provider-specific icon */}
                                            <span className="card-icon">{getProviderIcon(provider.provider)}</span>
                                            <h4>{provider.provider.toUpperCase()}</h4>
                                        </div>
                                        <div className="card-body">
                                            {provider.status === 'active' ? (
                                                // Active provider: show MTD cost
                                                <>
                                                    <div className="metric-value">
                            <span className="value">
                              ${typeof provider.mtd_cost === 'number' ? provider.mtd_cost.toFixed(2) : '0.00'}
                            </span>
                                                    </div>
                                                    <div style={{fontSize: '12px', color: '#94a3b8', marginTop: '8px'}}>
                                                        MTD Cost
                                                    </div>
                                                </>
                                            ) : (
                                                // Inactive/error provider: show error message
                                                <div className="error" style={{fontSize: '14px', color: '#ef4444'}}>
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

            {/* Services Breakdown Component */}
            {/* Shows hierarchical breakdown of costs by service category */}
            <ServicesBreakdown/>
        </div>
    );
}

/**
 * Get emoji icon for a cloud provider
 *
 * Icons provide visual consistency across the dashboard:
 * - GCP: ☁️ (cloud)
 * - AWS: 🟠 (orange circle)
 * - Azure: 🔷 (blue diamond)
 *
 * @param {string} provider - Provider name (case-insensitive)
 * @returns {string} Emoji icon for the provider
 */
function getProviderIcon(provider) {
    const icons = {gcp: '☁️', aws: '🟠', azure: '🔷'};
    return icons[provider?.toLowerCase()] || '☁️';  // Default to cloud emoji
}