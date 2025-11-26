import React, {useState} from 'react';
import {useServicesBreakdown} from '../../../hooks/useCloudData';

export default function ServicesBreakdown() {
    const {data, loading, error} = useServicesBreakdown();
    const [selectedProvider, setSelectedProvider] = useState('all');
    const [expandedCategory, setExpandedCategory] = useState(null);
    const [showAllServices, setShowAllServices] = useState({});

    if (loading) {
        return <div className="panel-loading">Loading services...</div>;
    }

    if (error || !data || !data.providers) {
        return null;
    }

    const providers = Object.keys(data.providers).filter(p => !data.providers[p].error);

    const getBreakdownData = () => {
        if (selectedProvider === 'all') {
            const combined = {};
            providers.forEach(provider => {
                const providerData = data.providers[provider];
                if (providerData?.breakdown) {
                    providerData.breakdown.forEach(cat => {
                        if (!combined[cat.category]) {
                            combined[cat.category] = {
                                category: cat.category,
                                total_cost: 0,
                                service_count: 0,
                                services: []
                            };
                        }
                        combined[cat.category].total_cost += cat.total_cost;
                        combined[cat.category].service_count += cat.service_count;
                        combined[cat.category].services.push(...cat.services.map(s => ({...s, provider})));
                    });
                }
            });
            return Object.values(combined).sort((a, b) => b.total_cost - a.total_cost);
        }
        return data.providers[selectedProvider]?.breakdown || [];
    };

    const breakdownData = getBreakdownData();
    const totalCost = selectedProvider === 'all' ? data.total_cost : data.providers[selectedProvider]?.total_cost || 0;
    const totalServices = selectedProvider === 'all' ? data.total_services : data.providers[selectedProvider]?.total_services || 0;

    const getCategoryIcon = (category) => {
        const icons = {
            'Compute': '🖥️', 'Storage': '💾', 'Database': '🗄️', 'Networking': '🌐',
            'Analytics': '📊', 'Machine Learning': '🤖', 'Security': '🔒', 'Management': '⚙️'
        };
        return icons[category] || '📦';
    };

    const getProviderIcon = (provider) => {
        const icons = {aws: '🟠', azure: '🔷', gcp: '☁️'};
        return icons[provider] || '☁️';
    };

    const getCategoryColor = (category) => {
        const colors = {
            'Compute': '#ef4444', 'Storage': '#f97316', 'Database': '#eab308', 'Networking': '#22c55e',
            'Analytics': '#14b8a6', 'Machine Learning': '#3b82f6', 'Security': '#8b5cf6', 'Management': '#ec4899'
        };
        return colors[category] || '#64748b';
    };

    const toggleShowAll = (category) => {
        setShowAllServices(prev => ({
            ...prev,
            [category]: !prev[category]
        }));
    };

    return (
        <div className="services-panel">
            <div className="panel-header">
                <h3>📦 Services Breakdown</h3>
                <select value={selectedProvider} onChange={(e) => setSelectedProvider(e.target.value)}
                        className="provider-select">
                    <option value="all">All Providers</option>
                    {providers.map(p => <option key={p} value={p}>{p.toUpperCase()}</option>)}
                </select>
            </div>

            <div className="categories-list">
                {breakdownData.map((cat) => {
                    const sortedServices = cat.services.sort((a, b) => b.cost - a.cost);
                    const showAll = showAllServices[cat.category];
                    const displayedServices = showAll ? sortedServices : sortedServices.slice(0, 10);
                    const remainingCount = sortedServices.length - 10;

                    return (
                        <div key={cat.category}
                             className={`category-card ${expandedCategory === cat.category ? 'expanded' : ''}`}>
                            <div className="category-header"
                                 onClick={() => setExpandedCategory(expandedCategory === cat.category ? null : cat.category)}>
                                <div className="category-info">
                                    <span className="category-icon">{getCategoryIcon(cat.category)}</span>
                                    <div className="category-details">
                                        <h4 className="category-name">{cat.category}</h4>
                                        <span className="category-count">{cat.service_count} services</span>
                                    </div>
                                </div>
                                <div className="category-cost">
                                    <span className="cost-value">${cat.total_cost?.toLocaleString()}</span>
                                    <span
                                        className="cost-percent">{((cat.total_cost / totalCost) * 100).toFixed(1)}%</span>
                                </div>
                                <span className="expand-icon">{expandedCategory === cat.category ? '▲' : '▼'}</span>
                            </div>

                            <div className="category-progress">
                                <div className="progress-fill" style={{
                                    width: `${(cat.total_cost / totalCost) * 100}%`,
                                    background: getCategoryColor(cat.category)
                                }}/>
                            </div>

                            {expandedCategory === cat.category && (
                                <div className="services-list">
                                    <div className="services-header"><span>Service</span><span>Cost</span></div>
                                    {displayedServices.map((service, idx) => (
                                        <div key={`${service.service}-${idx}`} className="service-row">
                                            <div className="service-info">
                                                {selectedProvider === 'all' && <span
                                                    className="service-provider">{getProviderIcon(service.provider)}</span>}
                                                <span className="service-name">{service.service}</span>
                                            </div>
                                            <span className="service-cost">${service.cost?.toFixed(2)}</span>
                                        </div>
                                    ))}
                                    {remainingCount > 0 && (
                                        <div className="services-more" onClick={(e) => {
                                            e.stopPropagation();
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

            <div className="services-summary">
                <div className="summary-stat">
                    <span className="stat-value">{breakdownData.length}</span>
                    <span className="stat-label">Categories</span>
                </div>
                <div className="summary-stat">
                    <span className="stat-value">{totalServices}</span>
                    <span className="stat-label">Services</span>
                </div>
                <div className="summary-stat">
                    <span className="stat-value">${totalCost?.toLocaleString()}</span>
                    <span className="stat-label">Total Cost</span>
                </div>
            </div>

        </div>
    );
}