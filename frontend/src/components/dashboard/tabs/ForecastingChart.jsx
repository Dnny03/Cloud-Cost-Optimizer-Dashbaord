// frontend/src/components/dashboard/budgets/ForecastingChart.jsx
/**
 * Forecasting Chart Component
 *
 * This component displays a time-series chart showing historical costs
 * and projected future spending. It combines actual spending data with
 * ML-based forecasts to help users anticipate future costs.
 *
 * Features:
 * - Provider selector (all providers combined or individual)
 * - Current MTD (month-to-date) spending display
 * - Projected end-of-month (EOM) cost estimate
 * - Trend indicator (increasing, decreasing, stable)
 * - Interactive line chart with confidence band
 * - Custom tooltips showing date, cost, and data type
 * - Visual distinction between actual and forecast data points
 * - Responsive chart sizing
 *
 * Data fetched from the /api/forecast/<provider> endpoints which provide
 * historical costs and 7-day projections based on trend analysis.
 *
 * Used in the Budgets tab alongside the BudgetTracker component.
 */

import React, {useState} from 'react';

// Custom hook for fetching forecast data from all providers
import {useForecast} from '../../../hooks/useCloudData';

// Recharts library components for building the chart
// LineChart: Base line chart (not directly used, ComposedChart used instead)
// Line: Line series for cost data
// XAxis/YAxis: Chart axes with custom formatting
// CartesianGrid: Background grid lines
// Tooltip: Hover information display
// ResponsiveContainer: Makes chart responsive to parent size
// Area: Filled area for confidence band (high estimate)
// ComposedChart: Allows combining different chart types (Line + Area)
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, ComposedChart
} from 'recharts';

/**
 * ForecastingChart - Renders cost forecast visualization with trend analysis
 *
 * @returns {JSX.Element} Forecast chart panel with stats and interactive chart
 */
export default function ForecastingChart() {
    // Selected provider filter state
    // 'all' combines data from all providers, or select individual provider
    const [selectedProvider, setSelectedProvider] = useState('all');

    // Fetch forecast data using custom hook
    // Parameter 7 specifies 7-day forecast horizon
    const {data, loading, error} = useForecast(7);

    // =====================
    // Loading State
    // =====================
    if (loading) return <div className="loading">
        <div className="loading-spinner"></div>
        Loading forecast...</div>;

    // =====================
    // Error State
    // =====================
    if (error) return <div className="error">Failed to load forecast data</div>;

    // =====================
    // Empty State
    // =====================
    if (!data || !data.providers) return <div className="no-data">No forecast data available</div>;

    // Filter out providers that returned errors
    // Only include providers with valid forecast data
    const providers = Object.keys(data.providers).filter(p => !data.providers[p].error);

    /**
     * Get chart data based on selected provider
     *
     * For 'all' providers: Combines forecast data from all providers,
     * summing costs for each date to show total spending projection.
     *
     * For individual provider: Returns that provider's forecast data directly.
     *
     * @returns {Array} Array of data points with date, cost, cost_low, cost_high, type
     */
    const getChartData = () => {
        if (selectedProvider === 'all') {
            // Combine data from all providers by date
            const combinedData = {};

            providers.forEach(provider => {
                const forecast = data.providers[provider];
                if (forecast?.forecast_data) {
                    forecast.forecast_data.forEach(item => {
                        // Initialize date entry if first occurrence
                        if (!combinedData[item.date]) {
                            combinedData[item.date] = {
                                date: item.date,
                                cost: 0,
                                cost_low: 0,
                                cost_high: 0,
                                type: item.type  // 'actual' or 'forecast'
                            };
                        }
                        // Sum costs across providers for this date
                        combinedData[item.date].cost += item.cost || 0;
                        combinedData[item.date].cost_low += item.cost_low || item.cost || 0;
                        combinedData[item.date].cost_high += item.cost_high || item.cost || 0;
                    });
                }
            });

            // Convert object to array and sort by date
            return Object.values(combinedData).sort((a, b) => new Date(a.date) - new Date(b.date));
        }

        // Return individual provider's forecast data
        return data.providers[selectedProvider]?.forecast_data || [];
    };

    // Generate chart data based on current selection
    const chartData = getChartData();

    // Calculate summary metrics based on selection
    // For 'all': Use pre-calculated totals from API
    // For individual: Use provider-specific values
    const currentMTD = selectedProvider === 'all' ? data.total_current_mtd : data.providers[selectedProvider]?.current_mtd || 0;
    const projectedEOM = selectedProvider === 'all' ? data.total_projected_eom : data.providers[selectedProvider]?.projected_eom || 0;

    // Determine trend for combined view vs individual provider
    // For 'all': Calculate based on MTD vs EOM ratio (>1.5x = increasing)
    // For individual: Use API-provided trend value
    const trend = selectedProvider === 'all' ? (projectedEOM > currentMTD * 1.5 ? 'increasing' : 'stable') : data.providers[selectedProvider]?.trend || 'stable';

    /**
     * Format ISO date string for chart axis labels
     *
     * @param {string} dateStr - ISO date string
     * @returns {string} Formatted date (e.g., "Jan 15")
     */
    const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString('en-US', {month: 'short', day: 'numeric'});

    /**
     * Custom Tooltip Component
     *
     * Renders a styled tooltip when hovering over chart data points.
     * Shows date, cost amount, and whether it's actual or forecast data.
     *
     * @param {Object} props - Recharts tooltip props
     * @param {boolean} props.active - Whether tooltip is active
     * @param {Array} props.payload - Data for the hovered point
     * @param {string} props.label - X-axis value (date)
     * @returns {JSX.Element|null} Tooltip element or null if inactive
     */
    const CustomTooltip = ({active, payload, label}) => {
        if (active && payload && payload.length) {
            const item = payload[0].payload;
            return (
                <div className="chart-tooltip">
                    {/* Formatted date */}
                    <div className="tooltip-date">{formatDate(label)}</div>
                    {/* Cost value with 2 decimal places */}
                    <div className="tooltip-cost">${item.cost?.toFixed(2)}</div>
                    {/* Data type indicator with emoji */}
                    <div className="tooltip-type">{item.type === 'actual' ? '📊 Actual' : '🔮 Forecast'}</div>
                </div>
            );
        }
        return null;
    };

    // =====================
    // Render
    // =====================
    return (
        <div className="card forecast-card">
            {/* Card header with title and provider selector */}
            <div className="card-header">
                <span className="card-icon">📈</span>
                <h4>Cost Forecast</h4>

                {/* Provider filter dropdown */}
                {/* Allows viewing combined or individual provider forecasts */}
                <select value={selectedProvider} onChange={(e) => setSelectedProvider(e.target.value)}
                        className="provider-select">
                    <option value="all">All Providers</option>
                    {/* Dynamically generate options for available providers */}
                    {providers.map(p => <option key={p} value={p}>{p.toUpperCase()}</option>)}
                </select>
            </div>

            {/* Summary statistics section */}
            <div className="forecast-stats">
                {/* Current month-to-date spending */}
                <div className="forecast-stat">
                    <span className="stat-label">Current MTD</span>
                    <span className="stat-value">${currentMTD?.toFixed(2)}</span>
                </div>

                {/* Projected end-of-month total */}
                <div className="forecast-stat">
                    <span className="stat-label">Projected EOM</span>
                    <span className="stat-value projected">${projectedEOM?.toFixed(2)}</span>
                </div>

                {/* Trend indicator with emoji and text */}
                <div className="forecast-stat">
                    <span className="stat-label">Trend</span>
                    <span className={`stat-value trend-${trend}`}>
            {/* Emoji based on trend direction */}
            {trend === 'increasing' ? '📈' : trend === 'decreasing' ? '📉' : '➡️'} {trend}
          </span>
                </div>
            </div>

            {/* Chart container */}
            <div className="chart-container">
                {/* ResponsiveContainer makes chart resize with parent */}
                <ResponsiveContainer width="100%" height={300}>
                    {/* ComposedChart allows mixing Line and Area chart types */}
                    <ComposedChart data={chartData} margin={{top: 10, right: 10, left: 0, bottom: 0}}>
                        {/* Background grid with dashed lines */}
                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB"/>

                        {/* X-axis showing formatted dates */}
                        <XAxis dataKey="date" tickFormatter={formatDate} stroke="#6B7280" fontSize={12}/>

                        {/* Y-axis with currency formatting */}
                        {/* Shows values as $Xk for thousands */}
                        <YAxis tickFormatter={(v) => `$${v >= 1000 ? (v / 1000).toFixed(1) + 'k' : v}`} stroke="#6B7280"
                               fontSize={12}/>

                        {/* Custom tooltip component */}
                        <Tooltip content={<CustomTooltip/>}/>

                        {/* Confidence band showing high estimate range */}
                        {/* Light purple fill with low opacity for subtle effect */}
                        <Area dataKey="cost_high" stroke="none" fill="#8B5CF6" fillOpacity={0.1}/>

                        {/* Main cost line */}
                        <Line
                            type="monotone"  // Smooth curve through points
                            dataKey="cost"
                            stroke="#4F46E5"  // Indigo color
                            strokeWidth={2}
                            // Custom dot renderer to differentiate actual vs forecast points
                            dot={(props) => {
                                const {cx, cy, payload} = props;
                                // Purple for forecast, indigo for actual
                                const color = payload.type === 'forecast' ? '#8B5CF6' : '#4F46E5';
                                return <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={4} fill={color} stroke={color}/>;
                            }}
                        />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>

            {/* Chart legend explaining dot colors */}
            <div className="chart-legend">
                <span className="legend-item"><span className="legend-dot actual"></span> Actual</span>
                <span className="legend-item"><span className="legend-dot forecast"></span> Forecast</span>
            </div>
        </div>
    );
}