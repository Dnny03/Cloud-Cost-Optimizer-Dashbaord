import React, { useState, useEffect } from 'react';
import { useProviders } from '../../hooks/useCloudData.js';
import api from "../../services/api.js";
import ProviderTab from './tabs/ProviderTab.jsx';
import OverviewTab from './tabs/OverviewTab.jsx';
import '../../styles/CloudDashboard.css';
import { useNavigate } from "react-router-dom";

/**
 * Safely get user data from localStorage
 */
function getUserData() {
  try {
    const userData = localStorage.getItem("user");
    if (userData) {
      const parsed = JSON.parse(userData);
      return parsed;
    }
  } catch (error) {
    console.error('Failed to parse user data:', error);
  }
  return null;
}

/**
 * Get username safely with fallback
 */
function getUserName() {
  const user = getUserData();
  return user?.username || 'User';
}

export default function CloudDashboard() {
  // Load configured cloud providers (AWS, GCP, Azure, etc.)
  const { providers, loading, error } = useProviders();

  // Track which tab is active: "overview" or provider.name (e.g., "gcp")
  const [activeTab, setActiveTab] = useState('overview');

  // Router navigation hook
  const navigate = useNavigate();

  // Update page title dynamically when activeTab or providers change
  useEffect(() => {
    if (activeTab === "overview") {
      document.title = "Overview | Cloud Cost Optimizer";
    } else {
      // Find the provider being viewed to set a more specific title
      const provider = providers.find(p => p.name === activeTab);
      document.title = provider
        ? `${provider.display_name} | Cloud Cost Optimizer`
        : "Dashboard | Cloud Cost Optimizer";
    }
  }, [activeTab, providers]);

  // Log out user and redirect to login screen
  function handleLogout() {
    try {
      api.logout(); // clear token/user from localStorage
    } catch (error) {
      console.error('Logout error:', error);
      // Force clear even if api.logout fails
      try {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } catch (e) {
        console.error('Failed to clear localStorage:', e);
      }
    }
    navigate("/login", { replace: true });
  }

  // Show loading / error states early
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

  return (
    <div className="cloud-dashboard">
      {/* ====== Header with title + user + logout ====== */}
      <header className="dashboard-header">
        <h1>Multi-Cloud Intelligence Dashboard</h1>

        <div className="header-actions">
          {/* Show username with safe access */}
          <span className="user-chip">
            {getUserName()}
          </span>

          <button
            onClick={handleLogout}
            className="logout-button"
            aria-label="Logout"
          >
            Logout
          </button>
        </div>
      </header>

      {/* ====== Tab Navigation ====== */}
      <nav className="tab-navigation" role="tablist">
        {/* Overview tab (always present) */}
        <button
          className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
          role="tab"
          aria-selected={activeTab === 'overview'}
          aria-controls="overview-panel"
        >
          <span className="tab-icon" aria-hidden="true">📊</span>
          <span className="tab-label">Overview</span>
        </button>

        {/* Dynamically render a tab for each configured cloud provider */}
        {/* Sort providers to match pie chart order: AWS, AZURE, GCP */}
        {[...providers]
          .sort((a, b) => {
            const order = { aws: 1, azure: 2, gcp: 3 };
            return (order[a.name] || 999) - (order[b.name] || 999);
          })
          .map((provider) => (
            <button
              key={provider.name}
              className={`tab-button ${activeTab === provider.name ? 'active' : ''}`}
              onClick={() => setActiveTab(provider.name)}
              role="tab"
              aria-selected={activeTab === provider.name}
              aria-controls={`${provider.name}-panel`}
            >
              <span className="tab-icon" aria-hidden="true">
                {getProviderIcon(provider.name)}
              </span>
              <span className="tab-label">{provider.display_name}</span>
            </button>
          ))}
      </nav>

      {/* ====== Tab Content ====== */}
      <div className="tab-content">
        {/* Overview tab panel */}
        <div
          id="overview-panel"
          role="tabpanel"
          className={`tab-panel ${activeTab === 'overview' ? 'active' : 'hidden'}`}
          aria-hidden={activeTab !== 'overview'}
        >
          {activeTab === 'overview' && <OverviewTab />}
        </div>

        {/* One panel per provider (only render tab content if active) */}
        {providers.map((provider) => (
          <div
            key={provider.name}
            id={`${provider.name}-panel`}
            role="tabpanel"
            className={`tab-panel ${activeTab === provider.name ? 'active' : 'hidden'}`}
            aria-hidden={activeTab !== provider.name}
          >
            {activeTab === provider.name && (
              <ProviderTab provider={provider.name} />
            )}
          </div>
        ))}
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
  return icons[provider] || '☁️';
}