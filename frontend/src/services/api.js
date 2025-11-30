// frontend/src/services/api.js
/**
 * Centralized API Client Module
 *
 * This module provides a unified interface for all HTTP communication
 * with the Flask backend API. It handles authentication, error handling,
 * and request/response processing.
 *
 * Features:
 * - Automatic JWT token attachment to authenticated requests
 * - Timezone header for server-side date localization
 * - Safe localStorage wrapper with error handling
 * - Automatic 401 handling with redirect to login
 * - Request cancellation support via AbortController
 * - Consistent error message extraction
 *
 * Configuration:
 * - Uses VITE_API_URL environment variable if set
 * - Falls back to "/api" for Vite development proxy
 *
 * Usage:
 * import api from './services/api';
 * const data = await api.getMTDCosts('aws');
 */

// Base URL for all API requests
// In development: Vite proxy handles /api -> backend
// In production: Set VITE_API_URL to the actual API endpoint
const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";

/**
 * Safe localStorage Wrapper
 *
 * Provides error-safe access to localStorage.
 * Some browsers (private mode, storage full) may throw errors.
 * This wrapper catches those errors and logs them gracefully.
 */
const storage = {
    /**
     * Safely get an item from localStorage
     *
     * @param {string} key - Storage key to retrieve
     * @returns {string|null} Stored value or null if not found/error
     */
    getItem(key) {
        try {
            return localStorage.getItem(key);
        } catch (error) {
            console.error(`Failed to get ${key} from localStorage:`, error);
            return null;
        }
    },

    /**
     * Safely set an item in localStorage
     *
     * @param {string} key - Storage key
     * @param {string} value - Value to store
     * @returns {boolean} True if successful, false if error
     */
    setItem(key, value) {
        try {
            localStorage.setItem(key, value);
            return true;
        } catch (error) {
            console.error(`Failed to set ${key} in localStorage:`, error);
            return false;
        }
    },

    /**
     * Safely remove an item from localStorage
     *
     * @param {string} key - Storage key to remove
     * @returns {boolean} True if successful, false if error
     */
    removeItem(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error(`Failed to remove ${key} from localStorage:`, error);
            return false;
        }
    }
};

/**
 * Retrieve the stored JWT token
 *
 * @returns {string|null} JWT token or null if not logged in
 */
function getToken() {
    return storage.getItem("token");
}

/**
 * Build Authorization header with JWT token
 *
 * Only includes the header if a token exists.
 * Format: "Bearer <token>"
 *
 * @returns {Object} Header object with Authorization key, or empty object
 */
function authHeaders() {
    const t = getToken();
    return t ? {Authorization: `Bearer ${t}`} : {};
}

/**
 * Build timezone header for server-side date localization
 *
 * Sends the client's IANA timezone string (e.g., "America/New_York")
 * so the server can format dates appropriately for the user's location.
 *
 * Falls back to "UTC" if browser APIs are restricted or unavailable.
 *
 * @returns {Object} Header object with X-Timezone key
 */
function tzHeader() {
    try {
        return {"X-Timezone": Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"};
    } catch {
        return {"X-Timezone": "UTC"};
    }
}

/**
 * Core HTTP Request Function
 *
 * Thin wrapper around fetch that handles:
 * - JSON content type headers
 * - Timezone and auth headers
 * - 401 unauthorized handling (auto-logout and redirect)
 * - Error message extraction from various response formats
 * - Request cancellation via AbortController
 *
 * @param {string} path - API endpoint path (e.g., "/auth/login")
 * @param {Object} options - Request options
 * @param {string} options.method - HTTP method (default: "GET")
 * @param {Object} options.headers - Additional headers
 * @param {string} options.body - Request body (JSON string)
 * @param {boolean} options.allow401 - If true, don't auto-redirect on 401
 * @param {AbortSignal} options.signal - AbortController signal for cancellation
 *
 * @returns {Promise<Object>} Parsed JSON response
 * @throws {Error} On network error, HTTP error, or abort
 */
async function request(path, {method = "GET", headers = {}, body, allow401 = false, signal} = {}) {
    try {
        // Make the HTTP request with all headers combined
        const res = await fetch(`${API_BASE_URL}${path}`, {
            method,
            headers: {
                "Content-Type": "application/json",
                ...tzHeader(),       // Always send timezone for date localization
                ...authHeaders(),    // Include JWT if user is authenticated
                ...headers,          // Any additional custom headers
            },
            body,
            signal,  // Support request cancellation via AbortController
        });

        // Parse response based on content type
        // Handle both JSON and plain text responses
        const contentType = res.headers.get("content-type") || "";
        const payload = contentType.includes("application/json")
            ? await res.json().catch(() => ({}))   // Parse JSON, fallback to empty object
            : await res.text().catch(() => "");    // Parse text, fallback to empty string

        // Handle 401 Unauthorized responses
        // Unless allow401 is set (for login/register forms), clear tokens and redirect
        if (res.status === 401) {
            if (!allow401) {
                // Clear stored credentials
                storage.removeItem("token");
                storage.removeItem("user");
                // Redirect to login page (unless already there)
                if (typeof window !== 'undefined' && window.location.pathname !== "/login") {
                    window.location.href = "/login";
                }
            }
            // Extract error message from response
            const msg = typeof payload === "string" ? payload : payload?.error || "Unauthorized";
            throw new Error(msg);
        }

        // Handle other HTTP errors (4xx, 5xx)
        if (!res.ok) {
            // Try to extract a meaningful error message from various response formats
            const msg =
                typeof payload === "string"
                    ? payload || `HTTP ${res.status}`
                    : payload?.error || payload?.message || `HTTP ${res.status}`;
            throw new Error(msg);
        }

        // Success - return parsed payload
        return payload;
    } catch (error) {
        // Handle AbortController cancellation
        if (error.name === 'AbortError') {
            throw new Error('Request was cancelled');
        }
        // Re-throw other errors (network errors, HTTP errors we threw above)
        throw error;
    }
}

/**
 * Cloud API Client Class
 *
 * Provides typed methods for all API endpoints.
 * Groups endpoints by functionality:
 * - Auth: login, register, forgot/reset password, logout
 * - Health: API liveness check
 * - Summary: providers list, cost summary
 * - Provider Details: MTD costs, daily costs, live metrics, timeseries
 * - Anomaly Detection: per-provider and all-provider anomalies
 * - Forecasting: cost projections
 * - Recommendations: optimization suggestions
 * - Alerts: active alerts
 * - Budgets: budget tracking
 * - Services: hierarchical cost breakdown
 */
class CloudAPI {
    // ==========================================
    // AUTHENTICATION ENDPOINTS
    // ==========================================

    /**
     * Authenticate user and store JWT token
     *
     * @param {string} username - User's username
     * @param {string} password - User's password
     * @returns {Promise<Object>} Response with token and user info
     * @throws {Error} If credentials are invalid or missing
     *
     * @example
     * const { token, user } = await api.login('john', 'password123');
     */
    async login(username, password) {
        // Validate required fields
        if (!username || !password) {
            throw new Error('Username and password are required');
        }

        // allow401: true so login form can display server error messages
        // without triggering automatic redirect to login page
        const data = await request("/auth/login", {
            method: "POST",
            body: JSON.stringify({username, password}),
            allow401: true,
        });

        // Persist authentication data on successful login
        if (data?.token) {
            storage.setItem("token", data.token);   // Store JWT for future requests
        }
        if (data?.user) {
            storage.setItem("user", JSON.stringify(data.user));  // Store user profile
        }

        return data;
    }

    /**
     * Register a new user account
     *
     * @param {string} username - Desired username (min 3 chars)
     * @param {string} password - Password (min 6 chars)
     * @param {string} email - Optional email for password recovery
     * @param {string} role - User role: "viewer" or "admin" (default: "viewer")
     *                        Note: Only first user can be admin
     * @returns {Promise<Object>} Response with success message
     * @throws {Error} If username taken or validation fails
     *
     * @example
     * await api.register('john', 'password123', 'john@example.com', 'viewer');
     */
    async register(username, password, email, role = "viewer") {
        if (!username || !password) {
            throw new Error('Username and password are required');
        }

        return request("/auth/register", {
            method: "POST",
            body: JSON.stringify({username, password, email, role}),
            allow401: true,  // Don't redirect on registration errors
        });
    }

    /**
     * Request a password reset token
     *
     * Sends a reset token to the user's email (if configured)
     * or returns the token directly in development mode.
     *
     * @param {Object} params - Identification parameters
     * @param {string} params.username - User's username
     * @param {string} params.email - User's email
     * @returns {Promise<Object>} Response with success message (and token in dev)
     * @throws {Error} If user not found
     *
     * @example
     * await api.forgotPassword({ username: 'john' });
     */
    async forgotPassword({username, email}) {
        if (!username && !email) {
            throw new Error('Username or email is required');
        }

        return request("/auth/forgot", {
            method: "POST",
            body: JSON.stringify({username, email}),
            allow401: true,
        });
    }

    /**
     * Reset password using a valid reset token
     *
     * @param {string} token - Password reset token (from email or API)
     * @param {string} new_password - New password (min 6 chars)
     * @returns {Promise<Object>} Response with success message
     * @throws {Error} If token invalid/expired or password too short
     *
     * @example
     * await api.resetPassword('abc123token', 'newpassword456');
     */
    async resetPassword(token, new_password) {
        if (!token || !new_password) {
            throw new Error('Token and new password are required');
        }

        return request("/auth/reset", {
            method: "POST",
            body: JSON.stringify({token, new_password}),
            allow401: true,
        });
    }

    /**
     * Log out the current user
     *
     * Clears stored JWT token and user data.
     * Since we use stateless JWT, no server call is needed.
     * The token simply won't be sent on future requests.
     */
    logout() {
        storage.removeItem("token");
        storage.removeItem("user");
    }

    // ==========================================
    // HEALTH CHECK ENDPOINTS
    // ==========================================

    /**
     * Check API health/liveness
     *
     * Simple endpoint to verify the API is running.
     * Used for monitoring and connection testing.
     *
     * @returns {Promise<Object>} Health status
     */
    checkHealth() {
        return request("/health");
    }

    // ==========================================
    // SUMMARY / PROVIDERS ENDPOINTS
    // ==========================================

    /**
     * Get list of configured cloud providers
     *
     * Returns the providers enabled in the backend configuration.
     *
     * @returns {Promise<Array>} Array of provider objects
     *                          [{name: 'aws', display_name: 'AWS'}, ...]
     */
    getProviders() {
        return request("/providers");
    }

    /**
     * Get combined cost summary across all providers
     *
     * Returns aggregated MTD costs and status for each provider.
     *
     * @returns {Promise<Array>} Array of provider cost summaries
     *                          [{provider, mtd_cost, status}, ...]
     */
    getCostsSummary() {
        return request("/costs/summary");
    }

    // ==========================================
    // PROVIDER-SPECIFIC ENDPOINTS
    // ==========================================

    /**
     * Get month-to-date costs for a specific provider
     *
     * @param {string} provider - Provider identifier ('aws', 'azure', 'gcp')
     * @returns {Promise<Array>} Array of cost items by service
     *                          [{service, project, cost}, ...]
     */
    getMTDCosts(provider) {
        if (!provider) {
            throw new Error('Provider is required');
        }
        return request(`/${provider}/costs/mtd`);
    }

    /**
     * Get daily cost breakdown for a provider
     *
     * @param {string} provider - Provider identifier
     * @param {number} days - Number of days to fetch (default: 30)
     * @returns {Promise<Array>} Array of daily costs [{date, cost}, ...]
     */
    getDailyCosts(provider, days = 30) {
        if (!provider) {
            throw new Error('Provider is required');
        }
        return request(`/${provider}/costs/daily?days=${days}`);
    }

    /**
     * Get live/current metrics for a provider
     *
     * Real-time metrics like CPU usage, instance counts.
     *
     * @param {string} provider - Provider identifier
     * @returns {Promise<Object>} Current metrics {cpu_percent, instances_monitored, ...}
     */
    getLiveMetrics(provider) {
        if (!provider) {
            throw new Error('Provider is required');
        }
        return request(`/${provider}/metrics/live`);
    }

    /**
     * Get timeseries metrics for charting
     *
     * @param {string} provider - Provider identifier
     * @param {string} type - Metric type: 'cpu', 'memory', 'network' (default: 'cpu')
     * @param {number} minutes - Time range in minutes (default: 30)
     * @returns {Promise<Array>} Array of data points [{timestamp, value}, ...]
     */
    getTimeseries(provider, type = "cpu", minutes = 30) {
        if (!provider) {
            throw new Error('Provider is required');
        }
        return request(`/${provider}/metrics/timeseries?type=${type}&minutes=${minutes}`);
    }

    // ==========================================
    // ANOMALY DETECTION ENDPOINTS
    // ==========================================

    /**
     * Get detected cost anomalies for a specific provider
     *
     * @param {string} provider - Provider identifier
     * @returns {Promise<Array>} Array of anomalies
     */
    getAnomalies(provider) {
        if (!provider) {
            throw new Error('Provider is required');
        }
        return request(`/${provider}/anomalies`);
    }

    /**
     * Get all anomalies across all providers
     *
     * Aggregates and sorts anomalies by deviation percentage.
     *
     * @returns {Promise<Array>} Array of anomalies from all providers
     */
    getAllAnomalies() {
        return request("/anomalies/all");
    }

    // ==========================================
    // FORECASTING ENDPOINTS
    // ==========================================

    /**
     * Get cost forecast for a specific provider
     *
     * @param {string} provider - Provider identifier
     * @param {number} days - Days to forecast (default: 7)
     * @returns {Promise<Object>} Forecast data with projections
     */
    getForecast(provider, days = 7) {
        if (!provider) {
            throw new Error('Provider is required');
        }
        return request(`/${provider}/forecast?days=${days}`);
    }

    /**
     * Get forecasts for all providers
     *
     * @param {number} days - Days to forecast (default: 7)
     * @returns {Promise<Object>} Combined forecast data
     *                           {providers: {...}, total_current_mtd, total_projected_eom}
     */
    getAllForecasts(days = 7) {
        return request(`/forecast/all?days=${days}`);
    }

    // ==========================================
    // RECOMMENDATIONS ENDPOINTS
    // ==========================================

    /**
     * Get cost optimization recommendations for a provider
     *
     * @param {string} provider - Provider identifier
     * @returns {Promise<Array>} Array of recommendations
     */
    getRecommendations(provider) {
        if (!provider) {
            throw new Error('Provider is required');
        }
        return request(`/${provider}/recommendations`);
    }

    /**
     * Get all recommendations across all providers
     *
     * @returns {Promise<Object>} Recommendations with savings totals
     *                           {recommendations: [...], total_potential_savings_monthly, ...}
     */
    getAllRecommendations() {
        return request("/recommendations/all");
    }

    // ==========================================
    // ALERTS ENDPOINTS
    // ==========================================

    /**
     * Get active alerts for a specific provider
     *
     * @param {string} provider - Provider identifier
     * @returns {Promise<Array>} Array of alerts
     */
    getAlerts(provider) {
        if (!provider) {
            throw new Error('Provider is required');
        }
        return request(`/${provider}/alerts`);
    }

    /**
     * Get all alerts across all providers
     *
     * @returns {Promise<Object>} Alerts with severity counts
     *                           {alerts: [...], severity_counts: {...}, unacknowledged_count}
     */
    getAllAlerts() {
        return request("/alerts/all");
    }

    // ==========================================
    // BUDGETS ENDPOINTS
    // ==========================================

    /**
     * Get budget tracking data for a specific provider
     *
     * @param {string} provider - Provider identifier
     * @returns {Promise<Array>} Array of budgets
     */
    getBudgets(provider) {
        if (!provider) {
            throw new Error('Provider is required');
        }
        return request(`/${provider}/budgets`);
    }

    /**
     * Get all budgets across all providers
     *
     * @returns {Promise<Object>} Budget data with totals
     *                           {budgets: [...], total_budget, total_spent, overall_utilization, ...}
     */
    getAllBudgets() {
        return request("/budgets/all");
    }

    // ==========================================
    // SERVICES BREAKDOWN ENDPOINTS
    // ==========================================

    /**
     * Get hierarchical service cost breakdown for a provider
     *
     * Organizes costs by category (Compute, Storage, etc.)
     *
     * @param {string} provider - Provider identifier
     * @returns {Promise<Object>} Breakdown by category with services
     */
    getServicesBreakdown(provider) {
        if (!provider) {
            throw new Error('Provider is required');
        }
        return request(`/${provider}/services/breakdown`);
    }

    /**
     * Get service breakdown for all providers
     *
     * @returns {Promise<Object>} Combined breakdown
     *                           {providers: {...}, total_cost, total_services}
     */
    getAllServicesBreakdown() {
        return request("/services/breakdown/all");
    }
}

// Create singleton instance of API client
const api = new CloudAPI();

// Default export for standard usage
export default api;

// Named export for convenience (used in some imports)
export const getCostsSummary = () => api.getCostsSummary();