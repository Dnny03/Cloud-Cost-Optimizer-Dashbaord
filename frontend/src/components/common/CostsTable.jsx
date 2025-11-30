// frontend/src/components/dashboard/CostsTable.jsx
/**
 * Costs Table Component
 *
 * This component displays cloud service cost data in a tabular format.
 * It shows service names, project names, and associated costs with a
 * total sum at the bottom.
 *
 * Features:
 * - Loading state with spinner
 * - Error state with styled error message
 * - Empty state for missing data
 * - Data validation and sanitization
 * - Scrollable table for large datasets
 * - Automatic total calculation
 * - XSS protection via string sanitization
 * - Accessible table with proper ARIA roles
 *
 * Used in provider-specific tabs to display detailed cost breakdowns.
 */

import React from 'react';

/**
 * CostsTable - Renders a table of cloud service costs
 *
 * @param {Object} props - Component props
 * @param {Array} props.data - Array of cost items with service, project, and cost fields
 * @param {boolean} props.loading - Whether data is currently being fetched
 * @param {string} props.error - Error message if data fetch failed
 *
 * @returns {JSX.Element} Loading spinner, error message, empty state, or costs table
 */
export default function CostsTable({data, loading, error}) {
    // =====================
    // Loading State
    // =====================
    // Show spinner while data is being fetched
    if (loading) {
        return (
            <div className="loading" style={{padding: '20px', textAlign: 'center'}}>
                <div className="loading-spinner">Loading costs...</div>
            </div>
        );
    }

    // =====================
    // Error State
    // =====================
    // Display error message with styled error container
    if (error) {
        return (
            <div className="error" style={{
                padding: '20px',
                textAlign: 'center',
                color: '#ef4444',  // Red color for errors
                background: 'rgba(239, 68, 68, 0.1)',  // Light red background
                borderRadius: '8px',
                border: '1px solid rgba(239, 68, 68, 0.3)'  // Red border
            }}>
                Error: {error}
            </div>
        );
    }

    // =====================
    // Empty State
    // =====================
    // Handle missing, invalid, or empty data arrays
    if (!data || !Array.isArray(data) || data.length === 0) {
        return (
            <div className="no-data" style={{
                padding: '20px',
                textAlign: 'center',
                color: '#94a3b8'  // Muted gray color
            }}>
                No cost data available
            </div>
        );
    }

    // =====================
    // API Error in Data
    // =====================
    // Check if the API returned an error object instead of data
    // Some endpoints return [{error: "message"}] instead of throwing
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

    // =====================
    // Data Validation
    // =====================
    // Filter out invalid items and error objects
    // Ensures only properly formatted cost items are displayed
    const validData = data.filter(item =>
        item && typeof item === 'object' && !item.error
    );

    // Handle case where all items were filtered out
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

    // =====================
    // Table Render
    // =====================
    return (
        // Wrapper with max height and scroll for large datasets
        <div className="costs-table-wrapper" style={{maxHeight: '400px', overflowY: 'auto'}}>
            {/* Accessible table with ARIA role */}
            <table className="costs-table" role="table">
                {/* Table header with column scope for accessibility */}
                <thead>
                <tr>
                    <th scope="col">Service</th>
                    <th scope="col">Project</th>
                    <th scope="col" className="cost-column">Cost</th>
                </tr>
                </thead>

                {/* Table body with cost data rows */}
                <tbody>
                {validData.map((item, index) => (
                    // Unique key combines service, project, and index for uniqueness
                    <tr key={`${item.service}-${item.project}-${index}`}>
                        {/* Service name - sanitized to prevent XSS */}
                        <td>{sanitizeString(item.service) || 'Unknown Service'}</td>
                        {/* Project name - shows dash if not available */}
                        <td>{sanitizeString(item.project) || '-'}</td>
                        {/* Cost value - formatted to 2 decimal places */}
                        <td className="cost-column">
                            ${formatCost(item.cost)}
                        </td>
                    </tr>
                ))}
                </tbody>

                {/* Table footer with total row */}
                <tfoot>
                <tr className="total-row">
                    {/* Total label spans service and project columns */}
                    <td colSpan="2">
                        <strong>Total</strong>
                    </td>
                    {/* Calculated total of all costs */}
                    <td className="cost-column">
                        <strong>${calculateTotal(validData)}</strong>
                    </td>
                </tr>
                </tfoot>
            </table>
        </div>
    );
}

/**
 * Calculate the total cost from an array of cost items
 *
 * Safely handles invalid data by:
 * - Checking if input is an array
 * - Parsing each cost value to float
 * - Treating NaN values as 0
 *
 * @param {Array} data - Array of cost items with 'cost' property
 * @returns {string} Total cost formatted to 2 decimal places
 */
function calculateTotal(data) {
    // Return zero if data is not a valid array
    if (!Array.isArray(data)) return '0.00';

    // Sum all valid cost values
    const total = data.reduce((sum, item) => {
        const cost = parseFloat(item?.cost) || 0;
        return sum + (isNaN(cost) ? 0 : cost);
    }, 0);

    // Format to 2 decimal places for currency display
    return total.toFixed(2);
}

/**
 * Format a cost value for display
 *
 * Safely converts any value to a formatted currency string.
 * Returns '0.00' for invalid or missing values.
 *
 * @param {any} cost - Cost value to format (string, number, or invalid)
 * @returns {string} Cost formatted to 2 decimal places
 */
function formatCost(cost) {
    const numCost = parseFloat(cost);
    // Return zero string for invalid numbers
    if (isNaN(numCost)) return '0.00';
    return numCost.toFixed(2);
}

/**
 * Sanitize a string for safe display
 *
 * Removes HTML tags to prevent XSS attacks when displaying
 * data that may come from external sources or user input.
 *
 * Security: This provides basic XSS protection by stripping HTML tags.
 * For more robust protection, consider using a library like DOMPurify.
 *
 * @param {any} str - String to sanitize (or any value to convert)
 * @returns {string} Sanitized string with HTML tags removed
 */
function sanitizeString(str) {
    // Return empty string for falsy values
    if (!str) return '';
    // Remove any potential HTML/script tags using regex
    // Converts to string first to handle non-string inputs
    return String(str).replace(/<[^>]*>/g, '').trim();
}