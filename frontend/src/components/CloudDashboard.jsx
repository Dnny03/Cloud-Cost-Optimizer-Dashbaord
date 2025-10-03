import React, { useState } from 'react';
import { useProviders } from '../hooks/useCloudData';
import ProviderTab from './ProviderTab';
import OverviewTab from './OverviewTab';
import './CloudDashboard.css';

export default function CloudDashboard() {
  const { providers, loading, error } = useProviders();
  const [activeTab, setActiveTab] = useState('overview');

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  if (error) {
    return <div className="error">Error: {error}</div>;
  }

  return (
    <div className="cloud-dashboard">
      <header className="dashboard-header">
        <h1>Multi-Cloud Intelligence Dashboard</h1>
      </header>

      {/* Tab Navigation */}
      <div className="tab-navigation">
        {/* Overview tab - always shown */}
        <button
          className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <span className="tab-icon">📊</span>
          <span className="tab-label">Overview</span>
        </button>

        {/* Provider tabs */}
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

      {/* Tab Content */}
      <div className="tab-content">
        {/* Overview Tab */}
        <div className={`tab-panel ${activeTab === 'overview' ? 'active' : 'hidden'}`}>
          {activeTab === 'overview' && <OverviewTab />}
        </div>

        {/* Provider Tabs */}
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

function getProviderIcon(provider) {
  const icons = {
    gcp: '☁️',
    aws: '🟠',
    azure: '🔷'
  };
  return icons[provider] || '☁️';
}