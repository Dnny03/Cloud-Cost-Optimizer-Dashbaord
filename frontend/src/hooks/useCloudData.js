// frontend/src/hooks/useCloudData.js
/**
 * Cloud Data Hooks Module
 *
 * This module provides a collection of custom React hooks for fetching
 * cloud cost and metrics data from the backend API. Each hook handles
 * its own loading states, error handling, and cleanup.
 *
 * Common Patterns:
 * - All hooks use mountedRef to prevent state updates after unmount
 * - All hooks return { data, loading, error } for consistent usage
 * - Some hooks support auto-refresh via intervals
 * - Some hooks provide a refetch function for manual refresh
 *
 * Memory Leak Prevention:
 * Each hook tracks component mount status using useRef and checks
 * this status before any setState call. This prevents the React
 * warning: "Can't perform a React state update on an unmounted component"
 *
 * Available Hooks:
 * 1.  useProviders - List of configured cloud providers
 * 2.  useMTDCosts - Month-to-date costs for a provider
 * 3.  useLiveMetrics - Live metrics with auto-refresh
 * 4.  useDailyCosts - Daily cost breakdown
 * 5.  useTimeseries - Time-series metric data
 * 6.  useAnomalies - Cost anomalies from all providers
 * 7.  useForecast - Cost forecasting data
 * 8.  useRecommendations - Cost optimization recommendations
 * 9.  useAlerts - Active alerts from all providers
 * 10. useBudgets - Budget tracking data
 * 11. useServicesBreakdown - Hierarchical service cost breakdown
 */

import {useState, useEffect, useRef} from 'react';

// API service for making HTTP requests to the backend
import api from '../services/api';

/**
 * Hook #1: useProviders
 *
 * Fetches the list of configured cloud providers from the backend.
 * Used to determine which provider tabs to display in the dashboard.
 *
 * API Endpoint: GET /api/providers
 *
 * @returns {Object} Hook state
 * @returns {Array} returns.providers - Array of provider objects [{name, display_name}, ...]
 * @returns {boolean} returns.loading - True while fetching
 * @returns {string|null} returns.error - Error message if fetch failed
 *
 * @example
 * const { providers, loading, error } = useProviders();
 * // providers = [{name: 'aws', display_name: 'AWS'}, ...]
 */
export function useProviders() {
    // State for storing the providers array
    const [providers, setProviders] = useState([]);
    // Loading state for UI feedback
    const [loading, setLoading] = useState(true);
    // Error state for displaying error messages
    const [error, setError] = useState(null);
    // AbortController ref for cancelling in-flight requests on unmount
    const abortControllerRef = useRef(null);

    useEffect(() => {
        // Create new AbortController for this effect
        abortControllerRef.current = new AbortController();

        /**
         * Fetch providers from API
         * Checks abort status before each state update
         */
        const fetchProviders = async () => {
            try {
                setLoading(true);
                setError(null);
                const data = await api.getProviders();

                // Only update state if request wasn't aborted
                if (!abortControllerRef.current.signal.aborted) {
                    setProviders(data);
                }
            } catch (err) {
                // Only set error if request wasn't aborted
                if (!abortControllerRef.current.signal.aborted) {
                    setError(err.message || 'Failed to fetch providers');
                }
            } finally {
                // Only update loading if request wasn't aborted
                if (!abortControllerRef.current.signal.aborted) {
                    setLoading(false);
                }
            }
        };

        fetchProviders();

        // Cleanup: abort any pending requests on unmount
        return () => {
            abortControllerRef.current?.abort();
        };
    }, []);  // Empty deps = fetch once on mount

    return {providers, loading, error};
}

/**
 * Hook #2: useMTDCosts
 *
 * Fetches month-to-date costs for a specific cloud provider.
 * Returns an array of cost items broken down by service.
 *
 * API Endpoint: GET /api/costs/mtd/<provider>
 *
 * @param {string} provider - Provider identifier ('aws', 'azure', 'gcp')
 *
 * @returns {Object} Hook state
 * @returns {Array} returns.data - Array of cost items [{service, project, cost}, ...]
 * @returns {boolean} returns.loading - True while fetching
 * @returns {string|null} returns.error - Error message if fetch failed
 *
 * @example
 * const { data, loading, error } = useMTDCosts('gcp');
 * // data = [{service: 'Compute Engine', project: 'my-project', cost: 123.45}, ...]
 */
export function useMTDCosts(provider) {
    // State for cost data array
    const [data, setData] = useState([]);
    // Loading state
    const [loading, setLoading] = useState(true);
    // Error state
    const [error, setError] = useState(null);
    // Track mount status to prevent state updates after unmount
    const mountedRef = useRef(true);

    useEffect(() => {
        // Reset mount status on each effect run
        mountedRef.current = true;

        // Early exit if no provider specified
        if (!provider) {
            setLoading(false);
            return;
        }

        /**
         * Fetch MTD costs for the specified provider
         */
        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);
                const result = await api.getMTDCosts(provider);

                // Only update state if still mounted
                if (mountedRef.current) {
                    setData(result);
                }
            } catch (err) {
                if (mountedRef.current) {
                    setError(err.message || 'Failed to fetch MTD costs');
                    setData([]);  // Reset to empty array on error
                }
            } finally {
                if (mountedRef.current) {
                    setLoading(false);
                }
            }
        };

        fetchData();

        // Cleanup: mark as unmounted
        return () => {
            mountedRef.current = false;
        };
    }, [provider]);  // Re-fetch when provider changes

    return {data, loading, error};
}

/**
 * Hook #3: useLiveMetrics
 *
 * Fetches live metrics for a provider with automatic refresh.
 * Useful for real-time dashboards showing CPU usage, instance counts, etc.
 *
 * API Endpoint: GET /api/metrics/live/<provider>
 *
 * @param {string} provider - Provider identifier ('aws', 'azure', 'gcp')
 * @param {number} refreshInterval - Auto-refresh interval in milliseconds (default: 30000)
 *                                   Set to 0 or null to disable auto-refresh
 *
 * @returns {Object} Hook state
 * @returns {Object|null} returns.data - Metrics object {cpu_percent, instances_monitored, ...}
 * @returns {boolean} returns.loading - True on initial load only
 * @returns {string|null} returns.error - Error message if fetch failed
 *
 * @example
 * const { data, loading, error } = useLiveMetrics('gcp', 30000);
 * // data = {cpu_percent: 45.2, instances_monitored: 12, ...}
 */
export function useLiveMetrics(provider, refreshInterval = 30000) {
    // State for metrics object (null until first fetch)
    const [data, setData] = useState(null);
    // Loading state - only true for initial load
    const [loading, setLoading] = useState(true);
    // Error state
    const [error, setError] = useState(null);
    // Track mount status
    const mountedRef = useRef(true);
    // Store interval ID for cleanup
    const intervalRef = useRef(null);

    useEffect(() => {
        mountedRef.current = true;

        // Early exit if no provider
        if (!provider) {
            setLoading(false);
            return;
        }

        /**
         * Fetch live metrics from API
         * Only sets loading=true on initial fetch (when data is null)
         * to avoid UI flicker during auto-refresh
         */
        const fetchData = async () => {
            try {
                // Only show loading spinner on initial fetch
                if (data === null) {
                    setLoading(true);
                }

                const result = await api.getLiveMetrics(provider);

                if (mountedRef.current) {
                    setData(result);
                    setError(null);  // Clear any previous errors
                }
            } catch (err) {
                if (mountedRef.current) {
                    setError(err.message || 'Failed to fetch live metrics');
                    // Note: Don't clear data on error - keep showing last known values
                }
            } finally {
                // Only update loading on initial fetch
                if (mountedRef.current && data === null) {
                    setLoading(false);
                }
            }
        };

        // Initial fetch
        fetchData();

        // Set up auto-refresh interval if specified
        if (refreshInterval && refreshInterval > 0) {
            intervalRef.current = setInterval(fetchData, refreshInterval);
        }

        // Cleanup: mark unmounted and clear interval
        return () => {
            mountedRef.current = false;
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [provider, refreshInterval]);  // Re-initialize when provider or interval changes

    return {data, loading, error};
}

/**
 * Hook #4: useDailyCosts
 *
 * Fetches daily cost breakdown for a provider over a specified period.
 * Useful for trend charts and historical analysis.
 *
 * API Endpoint: GET /api/costs/daily/<provider>?days=<days>
 *
 * @param {string} provider - Provider identifier ('aws', 'azure', 'gcp')
 * @param {number} days - Number of days of history to fetch (default: 30)
 *
 * @returns {Object} Hook state
 * @returns {Array} returns.data - Array of daily costs [{date, cost}, ...]
 * @returns {boolean} returns.loading - True while fetching
 * @returns {string|null} returns.error - Error message if fetch failed
 *
 * @example
 * const { data, loading, error } = useDailyCosts('aws', 30);
 * // data = [{date: '2024-01-15', cost: 156.78}, ...]
 */
export function useDailyCosts(provider, days = 30) {
    // State for daily costs array
    const [data, setData] = useState([]);
    // Loading state
    const [loading, setLoading] = useState(true);
    // Error state
    const [error, setError] = useState(null);
    // Track mount status
    const mountedRef = useRef(true);

    useEffect(() => {
        mountedRef.current = true;

        // Early exit if no provider
        if (!provider) {
            setLoading(false);
            return;
        }

        /**
         * Fetch daily costs for the specified period
         */
        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);
                const result = await api.getDailyCosts(provider, days);

                if (mountedRef.current) {
                    setData(result);
                }
            } catch (err) {
                if (mountedRef.current) {
                    setError(err.message || 'Failed to fetch daily costs');
                    setData([]);
                }
            } finally {
                if (mountedRef.current) {
                    setLoading(false);
                }
            }
        };

        fetchData();

        return () => {
            mountedRef.current = false;
        };
    }, [provider, days]);  // Re-fetch when provider or days changes

    return {data, loading, error};
}

/**
 * Hook #5: useTimeseries
 *
 * Fetches time-series metric data for a provider.
 * Used for detailed charts showing metric changes over time.
 *
 * API Endpoint: GET /api/metrics/timeseries/<provider>?type=<type>&minutes=<minutes>
 *
 * @param {string} provider - Provider identifier ('aws', 'azure', 'gcp')
 * @param {string} type - Metric type to fetch (default: 'cpu')
 *                        Options: 'cpu', 'memory', 'network', etc.
 * @param {number} minutes - Time range in minutes (default: 30)
 *
 * @returns {Object} Hook state
 * @returns {Array} returns.data - Array of data points [{timestamp, value}, ...]
 * @returns {boolean} returns.loading - True while fetching
 * @returns {string|null} returns.error - Error message if fetch failed
 *
 * @example
 * const { data, loading, error } = useTimeseries('gcp', 'cpu', 30);
 * // data = [{timestamp: '2024-01-15T10:00:00Z', value: 45.2}, ...]
 */
export function useTimeseries(provider, type = 'cpu', minutes = 30) {
    // State for timeseries data points
    const [data, setData] = useState([]);
    // Loading state
    const [loading, setLoading] = useState(true);
    // Error state
    const [error, setError] = useState(null);
    // Track mount status
    const mountedRef = useRef(true);

    useEffect(() => {
        mountedRef.current = true;

        // Early exit if no provider
        if (!provider) {
            setLoading(false);
            return;
        }

        /**
         * Fetch timeseries data for the specified metric type and period
         */
        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);
                const result = await api.getTimeseries(provider, type, minutes);

                if (mountedRef.current) {
                    setData(result);
                }
            } catch (err) {
                if (mountedRef.current) {
                    setError(err.message || 'Failed to fetch timeseries data');
                    setData([]);
                }
            } finally {
                if (mountedRef.current) {
                    setLoading(false);
                }
            }
        };

        fetchData();

        return () => {
            mountedRef.current = false;
        };
    }, [provider, type, minutes]);  // Re-fetch when any parameter changes

    return {data, loading, error};
}

/**
 * Hook #6: useAnomalies
 *
 * Fetches cost anomalies aggregated from all providers.
 * Anomalies are unusual spending patterns that deviate from expected costs.
 * Provides a refetch function for manual refresh.
 *
 * API Endpoint: GET /api/anomalies/all
 *
 * @returns {Object} Hook state
 * @returns {Array} returns.data - Array of anomaly objects
 *                                 [{id, provider, service, expected_cost, actual_cost, deviation_percent, ...}, ...]
 * @returns {boolean} returns.loading - True while fetching
 * @returns {string|null} returns.error - Error message if fetch failed
 * @returns {Function} returns.refetch - Function to manually trigger a refresh
 *
 * @example
 * const { data, loading, error, refetch } = useAnomalies();
 * // data = [{id: 1, provider: 'aws', service: 'EC2', deviation_percent: 150, ...}, ...]
 * // Call refetch() to reload data
 */
export function useAnomalies() {
    // State for anomalies array
    const [data, setData] = useState([]);
    // Loading state
    const [loading, setLoading] = useState(true);
    // Error state
    const [error, setError] = useState(null);
    // Track mount status
    const mountedRef = useRef(true);

    /**
     * Fetch anomalies from all providers
     * Defined outside useEffect to allow refetch
     */
    const fetchData = async () => {
        try {
            setLoading(true);
            setError(null);
            const result = await api.getAllAnomalies();

            if (mountedRef.current) {
                setData(result);
            }
        } catch (err) {
            if (mountedRef.current) {
                setError(err.message || 'Failed to fetch anomalies');
                setData([]);
            }
        } finally {
            if (mountedRef.current) {
                setLoading(false);
            }
        }
    };

    useEffect(() => {
        mountedRef.current = true;
        fetchData();

        return () => {
            mountedRef.current = false;
        };
    }, []);  // Fetch once on mount

    // Return refetch function for manual refresh capability
    return {data, loading, error, refetch: fetchData};
}

/**
 * Hook #7: useForecast
 *
 * Fetches cost forecast data for all providers.
 * Includes historical data and projected future costs.
 *
 * API Endpoint: GET /api/forecast/all?days=<days>
 *
 * @param {number} days - Number of days to forecast (default: 7)
 *
 * @returns {Object} Hook state
 * @returns {Object|null} returns.data - Forecast data object:
 *                        {
 *                          providers: {aws: {...}, azure: {...}, gcp: {...}},
 *                          total_current_mtd: number,
 *                          total_projected_eom: number
 *                        }
 * @returns {boolean} returns.loading - True while fetching
 * @returns {string|null} returns.error - Error message if fetch failed
 *
 * @example
 * const { data, loading, error } = useForecast(7);
 * // data = {providers: {...}, total_current_mtd: 5000, total_projected_eom: 8000}
 */
export function useForecast(days = 7) {
    // State for forecast data object (null until fetched)
    const [data, setData] = useState(null);
    // Loading state
    const [loading, setLoading] = useState(true);
    // Error state
    const [error, setError] = useState(null);
    // Track mount status
    const mountedRef = useRef(true);

    useEffect(() => {
        mountedRef.current = true;

        /**
         * Fetch forecast data for the specified period
         */
        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);
                const result = await api.getAllForecasts(days);

                if (mountedRef.current) {
                    setData(result);
                }
            } catch (err) {
                if (mountedRef.current) {
                    setError(err.message || 'Failed to fetch forecasts');
                    setData(null);
                }
            } finally {
                if (mountedRef.current) {
                    setLoading(false);
                }
            }
        };

        fetchData();

        return () => {
            mountedRef.current = false;
        };
    }, [days]);  // Re-fetch when days parameter changes

    return {data, loading, error};
}

/**
 * Hook #8: useRecommendations
 *
 * Fetches cost optimization recommendations from all providers.
 * Recommendations suggest ways to reduce cloud spending.
 *
 * API Endpoint: GET /api/recommendations/all
 *
 * @returns {Object} Hook state
 * @returns {Object|null} returns.data - Recommendations data:
 *                        {
 *                          recommendations: [{id, provider, title, description, potential_savings_monthly, ...}, ...],
 *                          total_potential_savings_monthly: number,
 *                          total_potential_savings_yearly: number
 *                        }
 * @returns {boolean} returns.loading - True while fetching
 * @returns {string|null} returns.error - Error message if fetch failed
 *
 * @example
 * const { data, loading, error } = useRecommendations();
 * // data = {recommendations: [...], total_potential_savings_monthly: 500}
 */
export function useRecommendations() {
    // State for recommendations data object
    const [data, setData] = useState(null);
    // Loading state
    const [loading, setLoading] = useState(true);
    // Error state
    const [error, setError] = useState(null);
    // Track mount status
    const mountedRef = useRef(true);

    useEffect(() => {
        mountedRef.current = true;

        /**
         * Fetch recommendations from all providers
         */
        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);
                const result = await api.getAllRecommendations();

                if (mountedRef.current) {
                    setData(result);
                }
            } catch (err) {
                if (mountedRef.current) {
                    setError(err.message || 'Failed to fetch recommendations');
                    setData(null);
                }
            } finally {
                if (mountedRef.current) {
                    setLoading(false);
                }
            }
        };

        fetchData();

        return () => {
            mountedRef.current = false;
        };
    }, []);  // Fetch once on mount

    return {data, loading, error};
}

/**
 * Hook #9: useAlerts
 *
 * Fetches active alerts from all providers.
 * Provides a refetch function for manual refresh.
 *
 * API Endpoint: GET /api/alerts/all
 *
 * @returns {Object} Hook state
 * @returns {Object|null} returns.data - Alerts data:
 *                        {
 *                          alerts: [{id, provider, severity, title, message, acknowledged, ...}, ...],
 *                          severity_counts: {critical: 2, high: 5, ...},
 *                          unacknowledged_count: number
 *                        }
 * @returns {boolean} returns.loading - True while fetching
 * @returns {string|null} returns.error - Error message if fetch failed
 * @returns {Function} returns.refetch - Function to manually trigger a refresh
 *
 * @example
 * const { data, loading, error, refetch } = useAlerts();
 * // data = {alerts: [...], severity_counts: {...}, unacknowledged_count: 3}
 */
export function useAlerts() {
    // State for alerts data object
    const [data, setData] = useState(null);
    // Loading state
    const [loading, setLoading] = useState(true);
    // Error state
    const [error, setError] = useState(null);
    // Track mount status
    const mountedRef = useRef(true);

    /**
     * Fetch alerts from all providers
     * Defined outside useEffect to allow refetch
     */
    const fetchData = async () => {
        try {
            setLoading(true);
            setError(null);
            const result = await api.getAllAlerts();

            if (mountedRef.current) {
                setData(result);
            }
        } catch (err) {
            if (mountedRef.current) {
                setError(err.message || 'Failed to fetch alerts');
                setData(null);
            }
        } finally {
            if (mountedRef.current) {
                setLoading(false);
            }
        }
    };

    useEffect(() => {
        mountedRef.current = true;
        fetchData();

        return () => {
            mountedRef.current = false;
        };
    }, []);  // Fetch once on mount

    // Return refetch function for manual refresh capability
    return {data, loading, error, refetch: fetchData};
}

/**
 * Hook #10: useBudgets
 *
 * Fetches budget tracking data from all providers.
 * Shows budget allocations, spending, and utilization.
 *
 * API Endpoint: GET /api/budgets/all
 *
 * @returns {Object} Hook state
 * @returns {Object|null} returns.data - Budget data:
 *                        {
 *                          budgets: [{id, name, type, budget_amount, spent_amount, utilization_percent, ...}, ...],
 *                          total_budget: number,
 *                          total_spent: number,
 *                          total_remaining: number,
 *                          overall_utilization: number,
 *                          at_risk_count: number
 *                        }
 * @returns {boolean} returns.loading - True while fetching
 * @returns {string|null} returns.error - Error message if fetch failed
 *
 * @example
 * const { data, loading, error } = useBudgets();
 * // data = {budgets: [...], total_budget: 10000, overall_utilization: 65.5}
 */
export function useBudgets() {
    // State for budget data object
    const [data, setData] = useState(null);
    // Loading state
    const [loading, setLoading] = useState(true);
    // Error state
    const [error, setError] = useState(null);
    // Track mount status
    const mountedRef = useRef(true);

    useEffect(() => {
        mountedRef.current = true;

        /**
         * Fetch budget data from all providers
         */
        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);
                const result = await api.getAllBudgets();

                if (mountedRef.current) {
                    setData(result);
                }
            } catch (err) {
                if (mountedRef.current) {
                    setError(err.message || 'Failed to fetch budgets');
                    setData(null);
                }
            } finally {
                if (mountedRef.current) {
                    setLoading(false);
                }
            }
        };

        fetchData();

        return () => {
            mountedRef.current = false;
        };
    }, []);  // Fetch once on mount

    return {data, loading, error};
}

/**
 * Hook #11: useServicesBreakdown
 *
 * Fetches hierarchical service cost breakdown for all providers.
 * Organizes costs by category (Compute, Storage, Database, etc.)
 * with individual services within each category.
 *
 * API Endpoint: GET /api/services/breakdown
 *
 * @returns {Object} Hook state
 * @returns {Object|null} returns.data - Services breakdown:
 *                        {
 *                          providers: {
 *                            aws: {breakdown: [{category, total_cost, service_count, services: [...]}], ...},
 *                            azure: {...},
 *                            gcp: {...}
 *                          },
 *                          total_cost: number,
 *                          total_services: number
 *                        }
 * @returns {boolean} returns.loading - True while fetching
 * @returns {string|null} returns.error - Error message if fetch failed
 *
 * @example
 * const { data, loading, error } = useServicesBreakdown();
 * // data = {providers: {...}, total_cost: 5000, total_services: 45}
 */
export function useServicesBreakdown() {
    // State for services breakdown data object
    const [data, setData] = useState(null);
    // Loading state
    const [loading, setLoading] = useState(true);
    // Error state
    const [error, setError] = useState(null);
    // Track mount status
    const mountedRef = useRef(true);

    useEffect(() => {
        mountedRef.current = true;

        /**
         * Fetch services breakdown from all providers
         */
        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);
                const result = await api.getAllServicesBreakdown();

                if (mountedRef.current) {
                    setData(result);
                }
            } catch (err) {
                if (mountedRef.current) {
                    setError(err.message || 'Failed to fetch services breakdown');
                    setData(null);
                }
            } finally {
                if (mountedRef.current) {
                    setLoading(false);
                }
            }
        };

        fetchData();

        return () => {
            mountedRef.current = false;
        };
    }, []);  // Fetch once on mount

    return {data, loading, error};
}