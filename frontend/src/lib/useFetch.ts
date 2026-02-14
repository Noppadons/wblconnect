"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import api from "@/lib/api";

interface FetchState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface UseFetchOptions {
  /** Skip the initial fetch (useful for conditional fetching) */
  skip?: boolean;
  /** Cache TTL in milliseconds (default: 30000 = 30s) */
  cacheTTL?: number;
  /** Params to pass as query string */
  params?: Record<string, string | number | boolean | undefined>;
}

// Simple in-memory cache
const cache = new Map<string, { data: unknown; timestamp: number }>();

function getCacheKey(url: string, params?: Record<string, string | number | boolean | undefined>): string {
  const paramStr = params
    ? "?" + Object.entries(params)
        .filter(([, v]) => v !== undefined)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => `${k}=${v}`)
        .join("&")
    : "";
  return url + paramStr;
}

// Deduplication: track in-flight requests
const inflight = new Map<string, Promise<unknown>>();

/**
 * SWR-like data fetching hook with caching and deduplication.
 *
 * @example
 * const { data, loading, error, refetch } = useFetch<Student[]>('/teacher/my-students', {
 *   params: { classroomId },
 *   cacheTTL: 60000,
 * });
 */
export function useFetch<T = unknown>(url: string, options: UseFetchOptions = {}) {
  const { skip = false, cacheTTL = 30000, params } = options;
  const cacheKey = getCacheKey(url, params);

  const [state, setState] = useState<FetchState<T>>(() => {
    // Return cached data immediately if available
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < cacheTTL) {
      return { data: cached.data as T, loading: false, error: null };
    }
    return { data: null, loading: !skip, error: null };
  });

  const mountedRef = useRef(true);
  const paramsRef = useRef(params);
  paramsRef.current = params;

  const fetchData = useCallback(async () => {
    if (skip) return;

    const key = cacheKey;

    // Check cache first
    const cached = cache.get(key);
    if (cached && Date.now() - cached.timestamp < cacheTTL) {
      if (mountedRef.current) {
        setState({ data: cached.data as T, loading: false, error: null });
      }
      return;
    }

    if (mountedRef.current) {
      setState((prev) => ({ ...prev, loading: true, error: null }));
    }

    try {
      // Deduplication: reuse in-flight request
      let promise = inflight.get(key) as Promise<T> | undefined;
      if (!promise) {
        promise = api
          .get(url, { params: paramsRef.current })
          .then((res) => res.data as T);
        inflight.set(key, promise);
      }

      const data = await promise;

      // Store in cache
      cache.set(key, { data, timestamp: Date.now() });

      if (mountedRef.current) {
        setState({ data, loading: false, error: null });
      }
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ||
        (err as Error)?.message ||
        "เกิดข้อผิดพลาด";
      if (mountedRef.current) {
        setState((prev) => ({ ...prev, loading: false, error: message }));
      }
    } finally {
      inflight.delete(key);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, cacheKey, skip, cacheTTL]);

  useEffect(() => {
    mountedRef.current = true;
    fetchData();
    return () => {
      mountedRef.current = false;
    };
  }, [fetchData]);

  const refetch = useCallback(() => {
    // Invalidate cache and re-fetch
    cache.delete(cacheKey);
    return fetchData();
  }, [cacheKey, fetchData]);

  return { ...state, refetch };
}

/** Invalidate all cached entries or a specific URL pattern */
export function invalidateCache(urlPattern?: string) {
  if (!urlPattern) {
    cache.clear();
    return;
  }
  for (const key of cache.keys()) {
    if (key.includes(urlPattern)) {
      cache.delete(key);
    }
  }
}
