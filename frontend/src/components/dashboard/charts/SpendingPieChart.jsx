import React from 'react';
import {PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer} from 'recharts';

// Map provider names to specific colors matching the icons in OverviewTab.jsx
// GCP: ☁️ (cloud - gray), AWS: 🟠 (orange circle), AZURE: 🔷 (blue diamond)
const PROVIDER_COLORS = {
    'GCP': '#94a3b8',    // Gray (matches cloud ☁️)
    'AWS': '#f59e0b',    // Orange (matches orange circle 🟠)
    'AZURE': '#3b82f6'   // Blue (matches blue diamond 🔷)
};

export default function SpendingPieChart({data}) {
    if (!data || data.length === 0) {
        return <p>No providers found</p>;
    }

    // Format data for Recharts with proper validation
    const formattedData = data
        .filter(p => p.mtd_cost && p.mtd_cost > 0)
        .map(p => ({
            name: p.provider.toUpperCase(),
            value: parseFloat(p.mtd_cost) || 0
        }));

    const total = formattedData.reduce((sum, p) => sum + p.value, 0);

    const displayData =
        total === 0
            ? [{name: 'No Spend', value: 1}]
            : formattedData;

    return (
        <div className="piechart-container" style={{height: 300}}>
            <ResponsiveContainer>
                <PieChart>
                    <Pie
                        data={displayData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="45%"
                        outerRadius={105}
                        label={({percent}) => `${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                    >
                        {displayData.map((entry, index) => (
                            <Cell
                                key={`cell-${index}`}
                                fill={total === 0 ? '#64748b' : (PROVIDER_COLORS[entry.name] || '#8b5cf6')}
                            />
                        ))}
                    </Pie>

                    <Tooltip
                        formatter={(value, name) =>
                            total === 0
                                ? [`$0`, 'Total Spend']
                                : [`$${value.toFixed(2)}`, 'Spend']
                        }
                    />
                    <Legend/>
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
}