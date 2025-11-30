// frontend/src/components/charts/SpendingPieChart.jsx
/**
 * Spending Pie Chart Component
 *
 * This component renders a pie chart showing the distribution of cloud
 * spending across different providers (AWS, Azure, GCP). It visualizes
 * month-to-date costs as proportional slices with percentages.
 *
 * Features:
 * - Color-coded slices matching provider icons
 * - Percentage labels on each slice
 * - Interactive tooltip showing exact dollar amounts
 * - Legend for provider identification
 * - Responsive sizing to fit container
 * - Graceful handling of zero spend
 * - Data validation and filtering
 *
 * Used in the Overview tab alongside the Total MTD Spend metric card.
 */

import React from 'react';

// Recharts library components for building the pie chart
// PieChart: Container for pie chart elements
// Pie: The actual pie/donut shape
// Cell: Individual slice styling
// Tooltip: Hover information display
// Legend: Chart legend for provider names
// ResponsiveContainer: Makes chart responsive to parent size
import {PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer} from 'recharts';

/**
 * Color mapping for cloud providers
 *
 * Colors are chosen to match the provider icons used in OverviewTab.jsx:
 * - GCP: ☁️ (cloud emoji) -> Gray (#94a3b8)
 * - AWS: 🟠 (orange circle) -> Orange (#f59e0b)
 * - AZURE: 🔷 (blue diamond) -> Blue (#3b82f6)
 *
 * This provides visual consistency between the pie chart and provider cards.
 */
const PROVIDER_COLORS = {
    'GCP': '#94a3b8',    // Gray (matches cloud ☁️)
    'AWS': '#f59e0b',    // Orange (matches orange circle 🟠)
    'AZURE': '#3b82f6'   // Blue (matches blue diamond 🔷)
};

/**
 * SpendingPieChart - Renders a pie chart of cloud provider spending
 *
 * @param {Object} props - Component props
 * @param {Array} props.data - Array of provider cost objects with format:
 *                             [{provider: "aws", mtd_cost: 1234.56}, ...]
 *
 * @returns {JSX.Element} Pie chart or empty state message
 *
 * @example
 * const providerData = [
 *   { provider: "aws", mtd_cost: 5000 },
 *   { provider: "azure", mtd_cost: 3000 },
 *   { provider: "gcp", mtd_cost: 2000 }
 * ];
 * <SpendingPieChart data={providerData} />
 */
export default function SpendingPieChart({data}) {
    // Handle missing or empty data
    if (!data || data.length === 0) {
        return <p>No providers found</p>;
    }

    // Format and validate data for Recharts
    // - Filter out providers with zero or missing costs
    // - Transform to Recharts expected format {name, value}
    // - Uppercase provider names for consistent display and color mapping
    const formattedData = data
        .filter(p => p.mtd_cost && p.mtd_cost > 0)  // Only include positive costs
        .map(p => ({
            name: p.provider.toUpperCase(),         // Uppercase for PROVIDER_COLORS lookup
            value: parseFloat(p.mtd_cost) || 0      // Ensure numeric value
        }));

    // Calculate total spend for percentage calculations and zero-state handling
    const total = formattedData.reduce((sum, p) => sum + p.value, 0);

    // Handle zero total spend case
    // Shows a gray "No Spend" placeholder slice instead of empty chart
    const displayData =
        total === 0
            ? [{name: 'No Spend', value: 1}]  // Placeholder for visual display
            : formattedData;

    return (
        // Container with fixed height for consistent chart sizing
        <div className="piechart-container" style={{height: 300}}>
            {/* ResponsiveContainer makes chart resize with parent */}
            <ResponsiveContainer>
                <PieChart>
                    {/* Pie component defines the actual chart */}
                    <Pie
                        data={displayData}
                        dataKey="value"       // Property containing numeric values
                        nameKey="name"        // Property containing slice labels
                        cx="50%"              // Center X position (middle)
                        cy="45%"              // Center Y position (slightly up for legend space)
                        outerRadius={105}     // Size of the pie chart
                        // Custom label showing percentage on each slice
                        label={({percent}) => `${(percent * 100).toFixed(0)}%`}
                        labelLine={false}     // Don't draw lines from slice to label
                    >
                        {/* Map each data entry to a colored Cell */}
                        {displayData.map((entry, index) => (
                            <Cell
                                key={`cell-${index}`}
                                // Use gray for zero spend, provider color otherwise
                                // Falls back to purple (#8b5cf6) for unknown providers
                                fill={total === 0 ? '#64748b' : (PROVIDER_COLORS[entry.name] || '#8b5cf6')}
                            />
                        ))}
                    </Pie>

                    {/* Tooltip shown on slice hover */}
                    <Tooltip
                        // Custom formatter for tooltip content
                        formatter={(value, name) =>
                            total === 0
                                ? [`$0`, 'Total Spend']                    // Zero state message
                                : [`$${value.toFixed(2)}`, 'Spend']        // Formatted dollar amount
                        }
                    />

                    {/* Legend showing provider names and colors */}
                    <Legend/>
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
}