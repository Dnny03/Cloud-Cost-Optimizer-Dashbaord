import { useState, useEffect } from 'react';
import api from '../services/api';

// Hook #1: Get list of providers
// Usage: const { providers, loading, error } = useProviders();
export function useProviders() {
  const [providers, setProviders] = useState([]);  // Store the data
  const [loading, setLoading] = useState(true);     // Loading state
  const [error, setError] = useState(null);         // Error state

  useEffect(() => {
    // This runs when component mounts
    const fetchProviders = async () => {
      try {
        const data = await api.getProviders();
        setProviders(data);  // Save the data
      } catch (err) {
        setError(err.message);  // Save the error
      } finally {
        setLoading(false);  // Done loading
      }
    };

    fetchProviders();
  }, []);  // Empty array = run once on mount

  return { providers, loading, error };
}

// Hook #2: Get MTD costs for a provider
// Usage: const { data, loading, error } = useMTDCosts('gcp');
export function useMTDCosts(provider) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!provider) return;  // Don't run if no provider selected

    const fetchData = async () => {
      setLoading(true);
      try {
        const result = await api.getMTDCosts(provider);
        setData(result);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [provider]);  // Re-run when provider changes

  return { data, loading, error };
}

// Hook #3: Get live metrics with auto-refresh
// Usage: const { data, loading, error } = useLiveMetrics('gcp', 30000);
export function useLiveMetrics(provider, refreshInterval = 30000) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!provider) return;

    const fetchData = async () => {
      try {
        const result = await api.getLiveMetrics(provider);
        setData(result);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();  // Fetch immediately
    
    // Then fetch every 30 seconds (or whatever refreshInterval is)
    const interval = setInterval(fetchData, refreshInterval);

    // Cleanup: stop the interval when component unmounts
    return () => clearInterval(interval);
  }, [provider, refreshInterval]);

  return { data, loading, error };
}