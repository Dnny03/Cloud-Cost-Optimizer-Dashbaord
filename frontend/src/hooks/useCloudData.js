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
    abortControllerRef.current = new AbortController();

    const fetchProviders = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await api.getProviders();

        if (!abortControllerRef.current.signal.aborted) {
          setProviders(data);
        }
      } catch (err) {
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
    mountedRef.current = true;

    if (!provider) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        if (data === null) {
          setLoading(true);
        }

        const result = await api.getLiveMetrics(provider);

        if (mountedRef.current) {
          setData(result);
          setError(null);
        }
      } catch (err) {
        if (mountedRef.current) {
          setError(err.message || 'Failed to fetch live metrics');
        }
      } finally {
        if (mountedRef.current && data === null) {
          setLoading(false);
        }
      }
    };

    fetchData();

    if (refreshInterval && refreshInterval > 0) {
      intervalRef.current = setInterval(fetchData, refreshInterval);
    }

    return () => {
      mountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [provider, refreshInterval]);

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

/**
 * Hook #6: Get all anomalies across providers
 * Usage: const { data, loading, error, refetch } = useAnomalies();
 */
export function useAnomalies() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const mountedRef = useRef(true);

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
  }, []);

  return { data, loading, error, refetch: fetchData };
}

/**
 * Hook #7: Get forecast data for all providers
 * Usage: const { data, loading, error } = useForecast(7);
 */
export function useForecast(days = 7) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

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
  }, [days]);

  return { data, loading, error };
}

/**
 * Hook #8: Get all recommendations across providers
 * Usage: const { data, loading, error } = useRecommendations();
 */
export function useRecommendations() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

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
  }, []);

  return { data, loading, error };
}

/**
 * Hook #9: Get all alerts across providers
 * Usage: const { data, loading, error, refetch } = useAlerts();
 */
export function useAlerts() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const mountedRef = useRef(true);

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
  }, []);

  return { data, loading, error, refetch: fetchData };
}

/**
 * Hook #10: Get all budgets across providers
 * Usage: const { data, loading, error } = useBudgets();
 */
export function useBudgets() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

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
  }, []);

  return { data, loading, error };
}

/**
 * Hook #11: Get services breakdown for all providers
 * Usage: const { data, loading, error } = useServicesBreakdown();
 */
export function useServicesBreakdown() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

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
  }, []);

  return { data, loading, error };
}