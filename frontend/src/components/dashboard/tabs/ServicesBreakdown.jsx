// frontend/src/components/dashboard/overview/ServicesBreakdown.jsx
/**
 * Services Breakdown Component
 *
 * This component displays a hierarchical breakdown of cloud service costs
 * organized by category (Compute, Storage, Database, etc.). It provides
 * an expandable/collapsible view of services within each category.
 *
 * Features:
 * - Provider selector (all providers combined or individual)
 * - Expandable category cards with service details
 * - Color-coded progress bars showing cost distribution
 * - Service count and cost percentage per category
 * - "Show more/less" pagination for categories with many services
 * - Summary statistics (categories, services, total cost)
 * - Sorted by cost (highest first)
 *
 * Data fetched from the /api/services/breakdown endpoint which provides
 * hierarchical service data from AWS, Azure, and GCP.
 *
 * Used in the Overview tab to show detailed service-level cost distribution.
 */

import React, {useState} from 'react';

// Custom hook for fetching services breakdown data from all providers
import {useServicesBreakdown} from '../../../hooks/useCloudData';

/**
 * ServicesBreakdown - Renders hierarchical service cost breakdown by category
 *
 * @returns {JSX.Element|null} Services breakdown panel or null if no data
 */
export default function ServicesBreakdown() {
    // Fetch services breakdown data using custom hook
    const {data, loading, error} = useServicesBreakdown();

    // Provider filter state: 'all' or specific provider name
    const [selectedProvider, setSelectedProvider] = useState('all');

    // Currently expanded category (null = all collapsed)
    const [expandedCategory, setExpandedCategory] = useState(null);

    // Track which categories have "show all" enabled
    // Object: { categoryName: boolean }
    const [showAllServices, setShowAllServices] = useState({});

    // =====================
    // Loading State
    // =====================
    if (loading) {
        return <div className="panel-loading">Loading services...</div>;
    }

    // =====================
    // Error/Empty State
    // =====================
    // Return null to hide panel when no data available
    // This allows the Overview tab to render without this section
    if (error || !data || !data.providers) {
        return null;
    }

    // Filter out providers that returned errors
    const providers = Object.keys(data.providers).filter(p => !data.providers[p].error);

    /**
     * Get breakdown data based on selected provider
     *
     * For 'all' providers: Combines categories from all providers,
     * merging services and summing costs for matching categories.
     *
     * For individual provider: Returns that provider's breakdown directly.
     *
     * @returns {Array} Array of category objects sorted by total_cost descending
     */
    const getBreakdownData = () => {
        if (selectedProvider === 'all') {
            // Combine data from all providers by category
            const combined = {};

            providers.forEach(provider => {
                const providerData = data.providers[provider];
                if (providerData?.breakdown) {
                    providerData.breakdown.forEach(cat => {
                        // Initialize category if first occurrence
                        if (!combined[cat.category]) {
                            combined[cat.category] = {
                                category: cat.category,
                                total_cost: 0,
                                service_count: 0,
                                services: []
                            };
                        }
                        // Aggregate costs and services
                        combined[cat.category].total_cost += cat.total_cost;
                        combined[cat.category].service_count += cat.service_count;
                        // Add provider info to each service for display
                        combined[cat.category].services.push(...cat.services.map(s => ({...s, provider})));
                    });
                }
            });

            // Convert to array and sort by cost (highest first)
            return Object.values(combined).sort((a, b) => b.total_cost - a.total_cost);
        }

        // Return individual provider's breakdown data
        return data.providers[selectedProvider]?.breakdown || [];
    };

    // Generate breakdown data based on current selection
    const breakdownData = getBreakdownData();

    // Calculate totals based on selection
    const totalCost = selectedProvider === 'all' ? data.total_cost : data.providers[selectedProvider]?.total_cost || 0;
    const totalServices = selectedProvider === 'all' ? data.total_services : data.providers[selectedProvider]?.total_services || 0;

    /**
     * Get emoji icon for service category
     *
     * Icons provide visual identification for different service types.
     *
     * @param {string} category - Category name
     * @returns {string} Emoji icon for the category
     */
    const getCategoryIcon = (category) => {
        const icons = {
            'Compute': '🖥️',          // Virtual machines, containers
            'Storage': '💾',          // Object storage, file systems
            'Database': '🗄️',         // SQL, NoSQL databases
            'Networking': '🌐',       // VPCs, load balancers, CDN
            'Analytics': '📊',        // Data analytics, BI tools
            'Machine Learning': '🤖', // ML/AI services
            'Security': '🔒',         // IAM, encryption, compliance
            'Management': '⚙️'        // Monitoring, logging, automation
        };
        return icons[category] || '📦';  // Default package icon
    };

    /**
     * Get emoji icon for cloud provider
     *
     * @param {string} provider - Provider name (aws, azure, gcp)
     * @returns {string} Emoji icon for the provider
     */
    const getProviderIcon = (provider) => {
        const icons = {aws: '🟠', azure: '🔷', gcp: '☁️'};
        return icons[provider] || '☁️';
    };

    /**
     * Get color for category progress bar
     *
     * Each category has a distinct color for visual differentiation
     * in progress bars and charts.
     *
     * @param {string} category - Category name
     * @returns {string} Hex color code
     */
    const getCategoryColor = (category) => {
        const colors = {
            'Compute': '#ef4444',        // Red
            'Storage': '#f97316',        // Orange
            'Database': '#eab308',       // Yellow
            'Networking': '#22c55e',     // Green
            'Analytics': '#14b8a6',      // Teal
            'Machine Learning': '#3b82f6', // Blue
            'Security': '#8b5cf6',       // Purple
            'Management': '#ec4899'      // Pink
        };
        return colors[category] || '#64748b';  // Default gray
    };

    /**
     * Toggle "show all services" for a category
     *
     * Allows viewing all services in a category instead of just top 10.
     *
     * @param {string} category - Category name to toggle
     */
    const toggleShowAll = (category) => {
        setShowAllServices(prev => ({
            ...prev,
            [category]: !prev[category]
        }));
    };

    // =====================
    // Render
    // =====================
    return (
        <div className="services-panel">
            {/* Panel header with title and provider selector */}
            <div className="panel-header">
                <h3>📦 Services Breakdown</h3>

                {/* Provider filter dropdown */}
                <select value={selectedProvider} onChange={(e) => setSelectedProvider(e.target.value)}
                        className="provider-select">
                    <option value="all">All Providers</option>
                    {/* Dynamically generate options for available providers */}
                    {providers.map(p => <option key={p} value={p}>{p.toUpperCase()}</option>)}
                </select>
            </div>

            {/* Categories list - expandable cards */}
            <div className="categories-list">
                {breakdownData.map((cat) => {
                    // Sort services by cost (highest first)
                    const sortedServices = cat.services.sort((a, b) => b.cost - a.cost);

                    // Check if "show all" is enabled for this category
                    const showAll = showAllServices[cat.category];

                    // Limit to 10 services unless "show all" is enabled
                    const displayedServices = showAll ? sortedServices : sortedServices.slice(0, 10);
                    const remainingCount = sortedServices.length - 10;

                    return (
                        // Category card with conditional expanded class
                        <div key={cat.category}
                             className={`category-card ${expandedCategory === cat.category ? 'expanded' : ''}`}>

                            {/* Clickable header to expand/collapse */}
                            <div className="category-header"
                                 onClick={() => setExpandedCategory(expandedCategory === cat.category ? null : cat.category)}>

                                {/* Left side: icon and category details */}
                                <div className="category-info">
                                    <span className="category-icon">{getCategoryIcon(cat.category)}</span>
                                    <div className="category-details">
                                        <h4 className="category-name">{cat.category}</h4>
                                        <span className="category-count">{cat.service_count} services</span>
                                    </div>
                                </div>

                                {/* Right side: cost and percentage */}
                                <div className="category-cost">
                                    <span className="cost-value">${cat.total_cost?.toLocaleString()}</span>
                                    {/* Percentage of total cost */}
                                    <span
                                        className="cost-percent">{((cat.total_cost / totalCost) * 100).toFixed(1)}%</span>
                                </div>

                                {/* Expand/collapse indicator */}
                                <span className="expand-icon">{expandedCategory === cat.category ? '▲' : '▼'}</span>
                            </div>

                            {/* Progress bar showing cost proportion */}
                            <div className="category-progress">
                                <div className="progress-fill" style={{
                                    width: `${(cat.total_cost / totalCost) * 100}%`,
                                    background: getCategoryColor(cat.category)
                                }}/>
                            </div>

                            {/* Expanded content: services list */}
                            {expandedCategory === cat.category && (
                                <div className="services-list">
                                    {/* Table header */}
                                    <div className="services-header"><span>Service</span><span>Cost</span></div>

                                    {/* Service rows */}
                                    {displayedServices.map((service, idx) => (
                                        <div key={`${service.service}-${idx}`} className="service-row">
                                            <div className="service-info">
                                                {/* Show provider icon only in "all providers" view */}
                                                {selectedProvider === 'all' && <span
                                                    className="service-provider">{getProviderIcon(service.provider)}</span>}
                                                <span className="service-name">{service.service}</span>
                                            </div>
                                            <span className="service-cost">${service.cost?.toFixed(2)}</span>
                                        </div>
                                    ))}

                                    {/* "Show more/less" toggle if more than 10 services */}
                                    {remainingCount > 0 && (
                                        <div className="services-more" onClick={(e) => {
                                            e.stopPropagation();  // Prevent category collapse
                                            toggleShowAll(cat.category);
                                        }}>
                                            {showAll ? '▲ Show less' : `+${remainingCount} more services`}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Summary statistics footer */}
            <div className="services-summary">
                {/* Category count */}
                <div className="summary-stat">
                    <span className="stat-value">{breakdownData.length}</span>
                    <span className="stat-label">Categories</span>
                </div>

                {/* Total service count */}
                <div className="summary-stat">
                    <span className="stat-value">{totalServices}</span>
                    <span className="stat-label">Services</span>
                </div>

                {/* Total cost */}
                <div className="summary-stat">
                    <span className="stat-value">${totalCost?.toLocaleString()}</span>
                    <span className="stat-label">Total Cost</span>
                </div>
            </div>

        </div>
    );
}