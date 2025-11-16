import React from 'react';

export default function CostsTable({ data, loading, error }) {
  if (loading) {
    return (
      <div className="loading" style={{ padding: '20px', textAlign: 'center' }}>
        <div className="loading-spinner">Loading costs...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error" style={{ 
        padding: '20px', 
        textAlign: 'center',
        color: '#ef4444',
        background: 'rgba(239, 68, 68, 0.1)',
        borderRadius: '8px',
        border: '1px solid rgba(239, 68, 68, 0.3)'
      }}>
        Error: {error}
      </div>
    );
  }

  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <div className="no-data" style={{ 
        padding: '20px', 
        textAlign: 'center',
        color: '#94a3b8' 
      }}>
        No cost data available
      </div>
    );
  }

  // Check if the data contains an error response
  if (data[0]?.error) {
    return (
      <div className="error" style={{ 
        padding: '20px', 
        textAlign: 'center',
        color: '#ef4444' 
      }}>
        Error: {data[0].error}
      </div>
    );
  }

  // Validate and sanitize data
  const validData = data.filter(item => 
    item && typeof item === 'object' && !item.error
  );

  if (validData.length === 0) {
    return (
      <div className="no-data" style={{ 
        padding: '20px', 
        textAlign: 'center',
        color: '#94a3b8' 
      }}>
        No valid cost data available
      </div>
    );
  }

  return (
    <div className="costs-table-wrapper">
      <table className="costs-table" role="table">
        <thead>
          <tr>
            <th scope="col">Service</th>
            <th scope="col">Project</th>
            <th scope="col" className="cost-column">Cost</th>
          </tr>
        </thead>
        <tbody>
          {validData.map((item, index) => (
            <tr key={`${item.service}-${item.project}-${index}`}>
              <td>{sanitizeString(item.service) || 'Unknown Service'}</td>
              <td>{sanitizeString(item.project) || '-'}</td>
              <td className="cost-column">
                ${formatCost(item.cost)}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="total-row">
            <td colSpan="2">
              <strong>Total</strong>
            </td>
            <td className="cost-column">
              <strong>${calculateTotal(validData)}</strong>
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

// Helper to calculate total with validation
function calculateTotal(data) {
  if (!Array.isArray(data)) return '0.00';
  
  const total = data.reduce((sum, item) => {
    const cost = parseFloat(item?.cost) || 0;
    return sum + (isNaN(cost) ? 0 : cost);
  }, 0);
  
  return total.toFixed(2);
}

// Helper to format cost values
function formatCost(cost) {
  const numCost = parseFloat(cost);
  if (isNaN(numCost)) return '0.00';
  return numCost.toFixed(2);
}

// Helper to sanitize strings for display
function sanitizeString(str) {
  if (!str) return '';
  // Remove any potential HTML/script tags
  return String(str).replace(/<[^>]*>/g, '').trim();
}