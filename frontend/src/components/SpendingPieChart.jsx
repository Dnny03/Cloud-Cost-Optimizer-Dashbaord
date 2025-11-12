import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#f59e0b', '#3b82f6', '#10b981', '#ef4444', '#8b5cf6'];

export default function SpendingPieChart({ data }) {
   if (!data || data.length === 0) {
    return <p>No providers found</p>;
  }

  
    // Format data for Recharts
  const formattedData = data
    .filter(p => p.mtd_cost && p.mtd_cost > 0)
    .map(p => ({
      name: p.provider.toUpperCase(),
      value: p.mtd_cost
    }));

    const total = formattedData.reduce((sum, p) => sum + p.value, 0);


   const displayData =
    total === 0
      ? [{ name: 'No Spend', value: 1 }]
      : formattedData;

  return (
    <div className="piechart-container" style={{ height: 300 }}>
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={displayData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={100}
            label={({ name, percent, value }) =>
              total === 0
                ? `${name}: $0`
                : `${name}: $${value.toFixed(2)} (${(percent * 100).toFixed(1)}%)`
            }
          >
            {displayData.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill={total === 0 ? '#64748b' : COLORS[index % COLORS.length]} // gray if no spend
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
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );}