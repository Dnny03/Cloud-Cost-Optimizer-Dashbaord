import { useState, useEffect, useRef } from 'react';
import api from '../services/api';

/**
 * Hook #1: Get list of providers
 * Usage: const { providers, loading, error } = useProviders();
 */
export function useProviders() {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const abortControllerRef = useRef(null);

  useEffect(() => {
    // Create abort controller for cleanup
    abortControllerRef.current = new AbortController();
    
    const fetchProviders = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await api.getProviders();
        
        // Only update state if component is still mounted
        if (!abortControllerRef.current.signal.aborted) {
          setProviders(data);
        }
      } catch (err) {
        // Only set error if component is still mounted
        if (!abortControllerRef.current.signal.aborted) {
          setError(err.message || 'Failed to fetch providers');
        }
      } finally {
        if (!abortControllerRef.current.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchProviders();

    // Cleanup function
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  return { providers, loading, error };
}

/**
 * Hook #2: Get MTD costs for a provider
 * Usage: const { data, loading, error } = useMTDCosts('gcp');
 */
export function useMTDCosts(provider) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    // Reset mounted ref
    mountedRef.current = true;

    if (!provider) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await api.getMTDCosts(provider);
        
        // Only update state if component is still mounted
        if (mountedRef.current) {
          setData(result);
        }
      } catch (err) {
        if (mountedRef.current) {
          setError(err.message || 'Failed to fetch MTD costs');
          setData([]);
        }
      } finally {
        if (mountedRef.current) {
          setLoading(false);
        }
      }
    };

    fetchData();

    // Cleanup function
    return () => {
      mountedRef.current = false;
    };
  }, [provider]);

  return { data, loading, error };
}

/**
 * Hook #3: Get live metrics with auto-refresh
 * Usage: const { data, loading, error } = useLiveMetrics('gcp', 30000);
 */
export function useLiveMetrics(provider, refreshInterval = 30000) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const mountedRef = useRef(true);
  const intervalRef = useRef(null);

  useEffect(() => {
    // Reset mounted ref
    mountedRef.current = true;

    if (!provider) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        // Don't set loading on refresh to avoid UI flicker
        if (data === null) {
          setLoading(true);
        }
        
        const result = await api.getLiveMetrics(provider);
        
        // Only update state if component is still mounted
        if (mountedRef.current) {
          setData(result);
          setError(null);
        }
      } catch (err) {
        if (mountedRef.current) {
          setError(err.message || 'Failed to fetch live metrics');
          // Don't clear data on error - keep showing last successful data
        }
      } finally {
        if (mountedRef.current && data === null) {
          setLoading(false);
        }
      }
    };

    // Fetch immediately
    fetchData();
    
    // Set up interval for auto-refresh
    if (refreshInterval && refreshInterval > 0) {
      intervalRef.current = setInterval(fetchData, refreshInterval);
    }

    // Cleanup function
    return () => {
      mountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [provider, refreshInterval]); // Note: including data in deps would cause infinite loop

  return { data, loading, error };
}

/**
 * Hook #4: Get daily costs with configurable days
 * Usage: const { data, loading, error } = useDailyCosts('aws', 30);
 */
export function useDailyCosts(provider, days = 30) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    if (!provider) {
      setLoading(false);
      return;
    }

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
  }, [provider, days]);

  return { data, loading, error };
}

/**
 * Hook #5: Get timeseries metrics
 * Usage: const { data, loading, error } = useTimeseries('gcp', 'cpu', 30);
 */
export function useTimeseries(provider, type = 'cpu', minutes = 30) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    if (!provider) {
      setLoading(false);
      return;
    }

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
  }, [provider, type, minutes]);

  return { data, loading, error };
}