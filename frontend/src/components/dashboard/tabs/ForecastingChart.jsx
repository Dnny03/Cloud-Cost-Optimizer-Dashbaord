import React, {useState} from 'react';
import {useForecast} from '../../../hooks/useCloudData';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, ComposedChart
} from 'recharts';

export default function ForecastingChart() {
    const [selectedProvider, setSelectedProvider] = useState('all');
    const {data, loading, error} = useForecast(7);

    if (loading) return <div className="loading">
        <div className="loading-spinner"></div>
        Loading forecast...</div>;
    if (error) return <div className="error">Failed to load forecast data</div>;
    if (!data || !data.providers) return <div className="no-data">No forecast data available</div>;

    const providers = Object.keys(data.providers).filter(p => !data.providers[p].error);

    const getChartData = () => {
        if (selectedProvider === 'all') {
            const combinedData = {};
            providers.forEach(provider => {
                const forecast = data.providers[provider];
                if (forecast?.forecast_data) {
                    forecast.forecast_data.forEach(item => {
                        if (!combinedData[item.date]) {
                            combinedData[item.date] = {
                                date: item.date,
                                cost: 0,
                                cost_low: 0,
                                cost_high: 0,
                                type: item.type
                            };
                        }
                        combinedData[item.date].cost += item.cost || 0;
                        combinedData[item.date].cost_low += item.cost_low || item.cost || 0;
                        combinedData[item.date].cost_high += item.cost_high || item.cost || 0;
                    });
                }
            });
            return Object.values(combinedData).sort((a, b) => new Date(a.date) - new Date(b.date));
        }
        return data.providers[selectedProvider]?.forecast_data || [];
    };

    const chartData = getChartData();
    const currentMTD = selectedProvider === 'all' ? data.total_current_mtd : data.providers[selectedProvider]?.current_mtd || 0;
    const projectedEOM = selectedProvider === 'all' ? data.total_projected_eom : data.providers[selectedProvider]?.projected_eom || 0;
    const trend = selectedProvider === 'all' ? (projectedEOM > currentMTD * 1.5 ? 'increasing' : 'stable') : data.providers[selectedProvider]?.trend || 'stable';

    const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString('en-US', {month: 'short', day: 'numeric'});

    const CustomTooltip = ({active, payload, label}) => {
        if (active && payload && payload.length) {
            const item = payload[0].payload;
            return (
                <div className="chart-tooltip">
                    <div className="tooltip-date">{formatDate(label)}</div>
                    <div className="tooltip-cost">${item.cost?.toFixed(2)}</div>
                    <div className="tooltip-type">{item.type === 'actual' ? '📊 Actual' : '🔮 Forecast'}</div>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="card forecast-card">
            <div className="card-header">
                <span className="card-icon">📈</span>
                <h4>Cost Forecast</h4>
                <select value={selectedProvider} onChange={(e) => setSelectedProvider(e.target.value)}
                        className="provider-select">
                    <option value="all">All Providers</option>
                    {providers.map(p => <option key={p} value={p}>{p.toUpperCase()}</option>)}
                </select>
            </div>

            <div className="forecast-stats">
                <div className="forecast-stat">
                    <span className="stat-label">Current MTD</span>
                    <span className="stat-value">${currentMTD?.toFixed(2)}</span>
                </div>
                <div className="forecast-stat">
                    <span className="stat-label">Projected EOM</span>
                    <span className="stat-value projected">${projectedEOM?.toFixed(2)}</span>
                </div>
                <div className="forecast-stat">
                    <span className="stat-label">Trend</span>
                    <span className={`stat-value trend-${trend}`}>
            {trend === 'increasing' ? '📈' : trend === 'decreasing' ? '📉' : '➡️'} {trend}
          </span>
                </div>
            </div>

            <div className="chart-container">
                <ResponsiveContainer width="100%" height={300}>
                    <ComposedChart data={chartData} margin={{top: 10, right: 10, left: 0, bottom: 0}}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB"/>
                        <XAxis dataKey="date" tickFormatter={formatDate} stroke="#6B7280" fontSize={12}/>
                        <YAxis tickFormatter={(v) => `$${v >= 1000 ? (v / 1000).toFixed(1) + 'k' : v}`} stroke="#6B7280"
                               fontSize={12}/>
                        <Tooltip content={<CustomTooltip/>}/>
                        <Area dataKey="cost_high" stroke="none" fill="#8B5CF6" fillOpacity={0.1}/>
                        <Line
                            type="monotone"
                            dataKey="cost"
                            stroke="#4F46E5"
                            strokeWidth={2}
                            dot={(props) => {
                                const {cx, cy, payload} = props;
                                const color = payload.type === 'forecast' ? '#8B5CF6' : '#4F46E5';
                                return <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={4} fill={color} stroke={color}/>;
                            }}
                        />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>

            <div className="chart-legend">
                <span className="legend-item"><span className="legend-dot actual"></span> Actual</span>
                <span className="legend-item"><span className="legend-dot forecast"></span> Forecast</span>
            </div>
        </div>
    );
}