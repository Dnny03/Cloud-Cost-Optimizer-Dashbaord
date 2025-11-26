import React, {useState, useEffect} from 'react';
import {useProviders} from '../../hooks/useCloudData.js';
import api from "../../services/api.js";
import ProviderTab from './tabs/ProviderTab.jsx';
import OverviewTab from './tabs/OverviewTab.jsx';
import InsightsTab from './tabs/InsightsTab.jsx';
import BudgetsTab from './tabs/BudgetsTab.jsx';
import '../../styles/CloudDashboard.css';
import {useNavigate} from "react-router-dom";

function getUserData() {
    try {
        const userData = localStorage.getItem("user");
        if (userData) {
            return JSON.parse(userData);
        }
    } catch (error) {
        console.error('Failed to parse user data:', error);
    }
    return null;
}

function getUserName() {
    const user = getUserData();
    return user?.username || 'User';
}

export default function CloudDashboard() {
    const {providers, loading, error} = useProviders();
    const [activeTab, setActiveTab] = useState('overview');
    const navigate = useNavigate();

    useEffect(() => {
        if (activeTab === "overview") {
            document.title = "Overview | Cloud Cost Optimizer";
        } else if (activeTab === "insights") {
            document.title = "Insights & Alerts | Cloud Cost Optimizer";
        } else if (activeTab === "budgets") {
            document.title = "Budgets & Forecast | Cloud Cost Optimizer";
        } else {
            const provider = providers.find(p => p.name === activeTab);
            document.title = provider
                ? `${provider.display_name} | Cloud Cost Optimizer`
                : "Dashboard | Cloud Cost Optimizer";
        }
    }, [activeTab, providers]);

    function handleLogout() {
        try {
            api.logout();
        } catch (error) {
            console.error('Logout error:', error);
            try {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
            } catch (e) {
                console.error('Failed to clear localStorage:', e);
            }
        }
        navigate("/login", {replace: true});
    }

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
            <header className="dashboard-header">
                <h1>Multi-Cloud Intelligence Dashboard</h1>
                <div className="header-actions">
                    <span className="user-chip">{getUserName()}</span>
                    <button onClick={handleLogout} className="logout-button" aria-label="Logout">
                        Logout
                    </button>
                </div>
            </header>

            <nav className="tab-navigation" role="tablist">
                {/* Overview tab */}
                <button
                    className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
                    onClick={() => setActiveTab('overview')}
                    role="tab"
                    aria-selected={activeTab === 'overview'}
                >
                    <span className="tab-icon">📊</span>
                    <span className="tab-label">Overview</span>
                </button>

                {/* Provider tabs - sorted AWS, AZURE, GCP */}
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

            <div className="tab-content">
                {/* Overview */}
                <div
                    role="tabpanel"
                    className={`tab-panel ${activeTab === 'overview' ? 'active' : 'hidden'}`}
                >
                    {activeTab === 'overview' && <OverviewTab/>}
                </div>

                {/* Provider tabs */}
                {providers.map((provider) => (
                    <div
                        key={provider.name}
                        role="tabpanel"
                        className={`tab-panel ${activeTab === provider.name ? 'active' : 'hidden'}`}
                    >
                        {activeTab === provider.name && <ProviderTab provider={provider.name}/>}
                    </div>
                ))}

                {/* Insights & Alerts */}
                <div
                    role="tabpanel"
                    className={`tab-panel ${activeTab === 'insights' ? 'active' : 'hidden'}`}
                >
                    {activeTab === 'insights' && <InsightsTab/>}
                </div>

                {/* Budgets & Forecast */}
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

function getProviderIcon(provider) {
    const icons = {gcp: '☁️', aws: '🟠', azure: '🔷'};
    return icons[provider] || '☁️';
}