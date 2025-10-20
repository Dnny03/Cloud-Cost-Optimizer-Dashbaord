import React, { useState, useEffect } from 'react';
import { useProviders } from '../hooks/useCloudData';
import api from "../services/api.js";
import ProviderTab from './ProviderTab';
import OverviewTab from './OverviewTab';
import './CloudDashboard.css';
import { useNavigate } from "react-router-dom";

export default function CloudDashboard() {
  // Load configured cloud providers (AWS, GCP, Azure, etc.)
  const { providers, loading, error } = useProviders();

  // Track which tab is active: "overview" or provider.name (e.g., "gcp")
  const [activeTab, setActiveTab] = useState('overview');

  // Router navigation hook
  const navigate = useNavigate();

  // ✅ Update page title dynamically when activeTab or providers change
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
    api.logout(); // clear token/user from localStorage
    navigate("/login", { replace: true });
  }

  // Show loading / error states early
  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  if (error) {
    return <div className="error">Error: {error}</div>;
  }

  return (
    <div className="cloud-dashboard">
      {/* ====== Header with title + user + logout ====== */}
      <header className="dashboard-header">
        <h1>Multi-Cloud Intelligence Dashboard</h1>

        <div className="header-actions">
          {/* Show username from localStorage (if exists) */}
          {localStorage.getItem("user") && (
            <span className="user-chip">
              {JSON.parse(localStorage.getItem("user")).username}
            </span>
          )}
          <button onClick={handleLogout} className="logout-button">
            Logout
          </button>
        </div>
      </header>

      {/* ====== Tab Navigation ====== */}
      <div className="tab-navigation">
        {/* Overview tab (always present) */}
        <button
          className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <span className="tab-icon">📊</span>
          <span className="tab-label">Overview</span>
        </button>

        {/* Dynamically render a tab for each configured cloud provider */}
        {providers.map((provider) => (
          <button
            key={provider.name}
            className={`tab-button ${activeTab === provider.name ? 'active' : ''}`}
            onClick={() => setActiveTab(provider.name)}
          >
            <span className="tab-icon">{getProviderIcon(provider.name)}</span>
            <span className="tab-label">{provider.display_name}</span>
          </button>
        ))}
      </div>

      {/* ====== Tab Content ====== */}
      <div className="tab-content">
        {/* Overview tab panel */}
        <div className={`tab-panel ${activeTab === 'overview' ? 'active' : 'hidden'}`}>
          {activeTab === 'overview' && <OverviewTab />}
        </div>

        {/* One panel per provider (only render tab content if active) */}
        {providers.map((provider) => (
          <div
            key={provider.name}
            className={`tab-panel ${activeTab === provider.name ? 'active' : 'hidden'}`}
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