// frontend/src/components/dashboard/MetricsCard.jsx
/**
 * Metrics Card Component
 *
 * A reusable card component for displaying a single metric value
 * with title, icon, and optional unit. Used throughout the dashboard
 * to show KPIs like total spend, active providers, and status indicators.
 *
 * Features:
 * - Customizable icon, title, value, and unit
 * - Loading state with spinner
 * - Error state handling
 * - Empty/null value handling
 * - Automatic number formatting
 * - Accessible with ARIA attributes
 *
 * Used in:
 * - Overview tab for total MTD spend, provider count, status
 * - Provider tabs for individual provider metrics
 */

import React from 'react';

/**
 * MetricsCard - Renders a single metric display card
 *
 * @param {Object} props - Component props
 * @param {string} props.title - Card title displayed in header
 * @param {string|number} props.value - The metric value to display
 * @param {string} props.unit - Optional unit suffix (e.g., "providers", "%")
 * @param {boolean} props.loading - Whether data is being fetched
 * @param {string|null} props.error - Error message if data fetch failed
 * @param {string} props.icon - Emoji or icon to display in header (default: 📊)
 *
 * @returns {JSX.Element} A styled card displaying the metric
 *
 * @example
 * // Basic usage
 * <MetricsCard title="Total Spend" value={1234.56} unit="USD" icon="💰" />
 *
 * @example
 * // With loading state
 * <MetricsCard title="Active Providers" value={null} loading={true} icon="☁️" />
 */
export default function MetricsCard({
                                        title,
                                        value,
                                        unit = '',           // Default to no unit
                                        loading = false,     // Default to not loading
                                        error = null,        // Default to no error
                                        icon = '📊'          // Default chart icon
                                    }) {
    return (
        // Card container with ARIA role and label for accessibility
        // Screen readers will announce this as a region with the title
        <div className="metrics-card" role="region" aria-label={title}>
            {/* Card header with icon and title */}
            <div className="card-header">
                {/* Icon is decorative, hidden from screen readers */}
                <span className="card-icon" aria-hidden="true">{icon}</span>
                <h4>{title}</h4>
            </div>

            {/* Card body with conditional content based on state */}
            <div className="card-body">
                {loading ? (
                    // Loading state: show spinner with accessibility attributes
                    // aria-live="polite" announces changes to screen readers
                    // aria-busy="true" indicates content is being updated
                    <div className="loading-spinner" aria-live="polite" aria-busy="true">
                        Loading...
                    </div>
                ) : error ? (
                    // Error state: show error message in red
                    <div className="error" style={{fontSize: '14px', color: '#ef4444'}}>
                        <span className="no-data">Error loading data</span>
                    </div>
                ) : (
                    // Normal state: display the metric value
                    <div className="metric-value">
                        {/* Check if value exists and is not null/undefined */}
                        {value !== null && value !== undefined ? (
                            <>
                                {/* Format and display the value */}
                                <span className="value">{formatValue(value)}</span>
                                {/* Conditionally render unit if provided */}
                                {unit && <span className="unit">{unit}</span>}
                            </>
                        ) : (
                            // No data available
                            <span className="no-data">No data</span>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

/**
 * Format a value for display in the metric card
 *
 * Handles different value types:
 * - Numbers: Formats decimals to 2 places, integers as-is
 * - Strings: Returns unchanged (already formatted)
 * - Other: Converts to string
 *
 * @param {any} value - The value to format
 * @returns {string} Formatted value string
 *
 * @example
 * formatValue(1234.567)  // Returns "1234.57"
 * formatValue(1234)      // Returns "1234"
 * formatValue("$1,234")  // Returns "$1,234"
 */
function formatValue(value) {
    // Handle numeric values
    if (typeof value === 'number') {
        // Check if it's a decimal number (has fractional part)
        if (value % 1 !== 0) {
            // Format to 2 decimal places for currency/percentage display
            return value.toFixed(2);
        }
        // Return integers as-is (converted to string)
        return value.toString();
    }

    // Handle string values
    if (typeof value === 'string') {
        // If it's already a formatted string (like from calculateTotal), return as is
        // This preserves pre-formatted values like "$1,234.56"
        return value;
    }

    // For any other type (objects, booleans, etc.), convert to string
    // This ensures the component never tries to render non-string children
    return String(value);
}