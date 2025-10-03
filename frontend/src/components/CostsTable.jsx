import React from 'react';

export default function CostsTable({ data, loading }) {
  if (loading) {
    return <div className="loading">Loading costs...</div>;
  }

  if (!data || data.length === 0) {
    return <div className="no-data">No cost data available</div>;
  }

  // Handle error response
  if (data[0]?.error) {
    return <div className="error">Error: {data[0].error}</div>;
  }

  return (
    <div className="costs-table-wrapper">
      <table className="costs-table">
        <thead>
          <tr>
            <th>Service</th>
            <th>Project</th>
            <th className="cost-column">Cost</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
            <tr key={index}>
              <td>{item.service || 'Unknown'}</td>
              <td>{item.project || '-'}</td>
              <td className="cost-column">
                ${typeof item.cost === 'number' ? item.cost.toFixed(2) : '0.00'}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="total-row">
            <td colSpan="2"><strong>Total</strong></td>
            <td className="cost-column">
              <strong>${calculateTotal(data)}</strong>
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

function calculateTotal(data) {
  return data
    .reduce((sum, item) => sum + (item.cost || 0), 0)
    .toFixed(2);
}