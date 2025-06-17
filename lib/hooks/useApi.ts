import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';

// Generic hook for API calls
export function useApi<T>(
  apiCall: () => Promise<T>
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await apiCall();
        if (isMounted) {
          setData(result);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'An error occurred');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [apiCall]);

  return { data, loading, error, refetch: () => setLoading(true) };
}

// Specific hooks for common API calls
export function useConversations() {
  return useApi(() => apiClient.getConversations());
}

export function useConversation(id: string | null) {
  return useApi(
    () => id ? apiClient.getConversation(id) : Promise.resolve(null)
  );
}

export function useMessages(conversationId: string | null) {
  return useApi(
    () => conversationId ? apiClient.getMessages(conversationId) : Promise.resolve([])
  );
}

export function usePreferences() {
  return useApi(() => apiClient.getPreferences());
}

export function useNotifications() {
  return useApi(() => apiClient.getNotifications());
}

export function useProfileStats() {
  return useApi(() => apiClient.getProfileStats());
}

// Hook for search with debouncing
export function useSearch(query: string, type: 'all' | 'conversations' | 'messages' = 'all') {
  const [debouncedQuery, setDebouncedQuery] = useState(query);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  return useApi(
    () => debouncedQuery.length >= 2 ? apiClient.search(debouncedQuery, type) : Promise.resolve({ conversations: [], messages: [] })
  );
}