import { useState, useEffect, useRef, useCallback } from 'react';
import type { WidgetPayload, WidgetType } from '../types';

interface UseWidgetDataResult {
  data: WidgetPayload | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

const BASE_URL = '/api/widgets';

/**
 * Fetches widget data from the backend with:
 * - AbortController cleanup on unmount / config change
 * - Exponential back-off retry (max 2 retries)
 * - Isolated error state per widget (one failing widget can't crash others)
 */
export function useWidgetData(
  widgetId: string,
  type: WidgetType,
  datasetId?: string
): UseWidgetDataResult {
  const [data, setData] = useState<WidgetPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fetchTick, setFetchTick] = useState(0);

  const abortRef = useRef<AbortController | null>(null);

  const refetch = useCallback(() => {
    setFetchTick((t) => t + 1);
  }, []);

  useEffect(() => {
    // Cancel any in-flight request for this widget
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    let cancelled = false;

    async function fetchWithRetry(attempt = 0): Promise<void> {
      setIsLoading(true);
      setError(null);

      try {
        const url = datasetId
          ? `${BASE_URL}/${type}?datasetId=${encodeURIComponent(datasetId)}`
          : `${BASE_URL}/${type}`;

        const res = await fetch(url, { signal: controller.signal });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error((body as { message?: string }).message ?? `HTTP ${res.status}`);
        }

        const json = (await res.json()) as { data: WidgetPayload };

        if (!cancelled) {
          setData(json.data);
          setIsLoading(false);
        }
      } catch (err) {
        if (cancelled || (err instanceof DOMException && err.name === 'AbortError')) return;

        if (attempt < 2) {
          // Exponential back-off: 500ms, 1000ms
          await new Promise((r) => setTimeout(r, 500 * 2 ** attempt));
          if (!cancelled) return fetchWithRetry(attempt + 1);
        }

        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Unknown error');
          setIsLoading(false);
        }
      }
    }

    void fetchWithRetry();

    return () => {
      cancelled = true;
      controller.abort();
    };
    // widgetId included so a widget replaced with a new one re-fetches
  }, [widgetId, type, datasetId, fetchTick]);

  return { data, isLoading, error, refetch };
}
