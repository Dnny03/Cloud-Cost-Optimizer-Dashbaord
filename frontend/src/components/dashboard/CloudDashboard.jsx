// frontend/src/components/dashboard/CloudDashboard.jsx
/**
 * Cloud Dashboard Component
 *
 * This is the main dashboard component that serves as the central hub
 * for the Cloud Cost Optimizer application. It provides a tabbed interface
 * for navigating between different views of cloud cost data.
 *
 * Features:
 * - Tabbed navigation (Overview, Providers, Insights, Budgets)
 * - Dynamic document title based on active tab
 * - User authentication status display
 * - Logout functionality
 * - Loading and error states
 * - Accessible tab navigation with ARIA attributes
 *
 * Tab Structure:
 * - Overview: Multi-cloud summary with aggregate metrics
 * - AWS/Azure/GCP: Provider-specific dashboards (dynamic based on config)
 * - Insights & Alerts: Recommendations, alerts, and anomalies
 * - Budgets & Forecast: Budget tracking and cost projections
 *
 * This component is the main view after successful authentication,
 * rendered at the /dashboard route.
 */

import React, {useState, useEffect} from 'react';

// Custom hook for fetching configured cloud providers
import {useProviders} from '../../hooks/useCloudData.js';

// API service for backend communication (logout)
import api from "../../services/api.js";

// Tab content components
import ProviderTab from './tabs/ProviderTab.jsx';    // Individual provider dashboard
import OverviewTab from './tabs/OverviewTab.jsx';    // Multi-cloud overview
import InsightsTab from './tabs/InsightsTab.jsx';    // Alerts and recommendations
import BudgetsTab from './tabs/BudgetsTab.jsx';      // Budget tracking and forecasting

// Dashboard-specific styles
import '../../styles/CloudDashboard.css';

// React Router hook for programmatic navigation
import {useNavigate} from "react-router-dom";

/**
 * Retrieve user data from localStorage
 *
 * Safely parses the stored user JSON object.
 * Handles parsing errors gracefully to prevent crashes.
 *
 * @returns {Object|null} User object with username, role, etc. or null if not found
 */
function getUserData() {
    try {
        const userData = localStorage.getItem("user");
        if (userData) {
            return JSON.parse(userData);
        }
    } catch (error) {
        // Log error but don't crash - user will see default name
        console.error('Failed to parse user data:', error);
    }
    return null;
}

/**
 * Get the current user's display name
 *
 * Retrieves username from stored user data.
 * Falls back to 'User' if not available.
 *
 * @returns {string} Username or 'User' as default
 */
function getUserName() {
    const user = getUserData();
    return user?.username || 'User';
}

/**
 * CloudDashboard - Main dashboard component with tabbed navigation
 *
 * @returns {JSX.Element} Complete dashboard interface
 */
export default function CloudDashboard() {
    // =====================
    // Hooks and State
    // =====================

    // Fetch list of configured cloud providers from API
    // Returns: { providers: [{name, display_name}, ...], loading, error }
    const {providers, loading, error} = useProviders();

    // Currently active tab identifier
    // Values: 'overview', 'insights', 'budgets', or provider name (aws, azure, gcp)
    const [activeTab, setActiveTab] = useState('overview');

    // React Router navigation hook for redirects
    const navigate = useNavigate();

    // =====================
    // Document Title Effect
    // =====================
    // Update browser tab title based on active tab
    useEffect(() => {
        if (activeTab === "overview") {
            document.title = "Overview | Cloud Cost Optimizer";
        } else if (activeTab === "insights") {
            document.title = "Insights & Alerts | Cloud Cost Optimizer";
        } else if (activeTab === "budgets") {
            document.title = "Budgets & Forecast | Cloud Cost Optimizer";
        } else {
            // Provider tab - find display name for title
            const provider = providers.find(p => p.name === activeTab);
            document.title = provider
                ? `${provider.display_name} | Cloud Cost Optimizer`
                : "Dashboard | Cloud Cost Optimizer";
        }
    }, [activeTab, providers]);  // Re-run when tab or providers change

    /**
     * Handle user logout
     *
     * Calls API logout endpoint to invalidate session,
     * clears local storage, and redirects to login page.
     * Includes fallback cleanup if API call fails.
     */
    function handleLogout() {
        try {
            // Call API logout (clears tokens server-side if applicable)
            api.logout();
        } catch (error) {
            console.error('Logout error:', error);
            // Fallback: manually clear localStorage if API call fails
            try {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
            } catch (e) {
                console.error('Failed to clear localStorage:', e);
            }
        }
        // Redirect to login page, replacing history to prevent back navigation
        navigate("/login", {replace: true});
    }

    // =====================
    // Loading State
    // =====================
    // Full-screen loading indicator while fetching providers
    if (loading) {
        return (
            <div className="loading" style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                <div>
                    <div className="loading-spinner">Loading dashboard...</div>
                </div>
            </div>
        );
    }

    // =====================
    // Error State
    // =====================
    // Full-screen error with retry button
    if (error) {
        return (
            <div className="error" style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                gap: '20px'
            }}>
                <div>Error: {error}</div>
                <button
                    onClick={() => window.location.reload()}
                    style={{
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
    // Main Dashboard Render
    // =====================
    return (
        <div className="cloud-dashboard">
            {/* Dashboard header with title. user info, and logout */}
            <header className="dashboard-header">
                <h1>Multi-Cloud Intelligence Dashboard</h1>
                <div className="header-actions">
                    {/* Display current user's name */}
                    <span className="user-chip">{getUserName()}</span>
                    {/* Logout button */}
                    <button onClick={handleLogout} className="logout-button" aria-label="Logout">
                        Logout
                    </button>
                </div>
            </header>

            {/* Tab navigation bar */}
            {/* Uses ARIA role="tablist" for accessibility */}
            <nav className="tab-navigation" role="tablist">
                {/* Overview tab - always first */}
                <button
                    className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
                    onClick={() => setActiveTab('overview')}
                    role="tab"
                    aria-selected={activeTab === 'overview'}
                >
                    <span className="tab-icon">📊</span>
                    <span className="tab-label">Overview</span>
                </button>

                {/* Provider tabs - dynamically generated and sorted */}
                {/* Sort order: AWS (1), Azure (2), GCP (3) */}
                {[...providers]
                    .sort((a, b) => {
                        const order = {aws: 1, azure: 2, gcp: 3};
                        return (order[a.name] || 999) - (order[b.name] || 999);
                    })
                    .map((provider) => (
                        <button
                            key={provider.name}
                            className={`tab-button ${activeTab === provider.name ? 'active' : ''}`}
                            onClick={() => setActiveTab(provider.name)}
                            role="tab"
                            aria-selected={activeTab === provider.name}
                        >
                            <span className="tab-icon">{getProviderIcon(provider.name)}</span>
                            <span className="tab-label">{provider.display_name}</span>
                        </button>
                    ))}

                {/* Insights & Alerts tab */}
                <button
                    className={`tab-button ${activeTab === 'insights' ? 'active' : ''}`}
                    onClick={() => setActiveTab('insights')}
                    role="tab"
                    aria-selected={activeTab === 'insights'}
                >
                    <span className="tab-icon">💡</span>
                    <span className="tab-label">Insights & Alerts</span>
                </button>

                {/* Budgets & Forecast tab */}
                <button
                    className={`tab-button ${activeTab === 'budgets' ? 'active' : ''}`}
                    onClick={() => setActiveTab('budgets')}
                    role="tab"
                    aria-selected={activeTab === 'budgets'}
                >
                    <span className="tab-icon">💰</span>
                    <span className="tab-label">Budgets & Forecast</span>
                </button>
            </nav>

            {/* Tab content panels */}
            {/* Each panel uses role="tabpanel" for accessibility */}
            {/* Conditional rendering: only render active tab's content */}
            <div className="tab-content">
                {/* Overview panel */}
                <div
                    role="tabpanel"
                    className={`tab-panel ${activeTab === 'overview' ? 'active' : 'hidden'}`}
                >
                    {/* Only render component when tab is active (performance optimization) */}
                    {activeTab === 'overview' && <OverviewTab/>}
                </div>

                {/* Provider-specific panels (AWS, Azure, GCP) */}
                {/* Dynamically generated based on configured providers */}
                {providers.map((provider) => (
                    <div
                        key={provider.name}
                        role="tabpanel"
                        className={`tab-panel ${activeTab === provider.name ? 'active' : 'hidden'}`}
                    >
                        {/* Pass provider name to ProviderTab for data fetching */}
                        {activeTab === provider.name && <ProviderTab provider={provider.name}/>}
                    </div>
                ))}

                {/* Insights & Alerts panel */}
                <div
                    role="tabpanel"
                    className={`tab-panel ${activeTab === 'insights' ? 'active' : 'hidden'}`}
                >
                    {activeTab === 'insights' && <InsightsTab/>}
                </div>

                {/* Budgets & Forecast panel */}
                <div
                    role="tabpanel"
                    className={`tab-panel ${activeTab === 'budgets' ? 'active' : 'hidden'}`}
                >
                    {activeTab === 'budgets' && <BudgetsTab/>}
                </div>
            </div>
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
 * @param {string} provider - Provider name (case-sensitive, lowercase)
 * @returns {string} Emoji icon for the provider
 */
function getProviderIcon(provider) {
    const icons = {gcp: '☁️', aws: '🟠', azure: '🔷'};
    return icons[provider] || '☁️';  // Default to cloud emoji
}