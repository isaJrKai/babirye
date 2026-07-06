'use client';
import { useState, useEffect, useCallback } from 'react';

export function useApi<T>(url: string | null, options?: RequestInit) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!url) { setLoading(false); return; }
    try {
      setLoading(true);
      const token = typeof window !== 'undefined' ? localStorage.getItem('babirye_token') : null;
      const headers: Record<string, string> = { 'Content-Type': 'application/json', ...(options?.headers as Record<string, string>) };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(url, { ...options, headers });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json);
      setError(null);
    } catch (e: any) { setError(e.message); } finally { setLoading(false); }
  }, [url]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const post = useCallback(async (bodyOrUrl: any, body?: any) => {
    const token = localStorage.getItem('babirye_token');
    const postUrl = typeof bodyOrUrl === 'string' ? bodyOrUrl : url;
    const postBody = typeof bodyOrUrl === 'string' ? body : bodyOrUrl;
    if (!postUrl) throw new Error('No URL provided');
    const res = await fetch(postUrl, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: token ? `Bearer ${token}` : '' }, body: JSON.stringify(postBody) });
    return res.json();
  }, [url]);

  const put = useCallback(async (body: any) => {
    const token = localStorage.getItem('babirye_token');
    if (!url) throw new Error('No URL provided');
    const res = await fetch(url, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: token ? `Bearer ${token}` : '' }, body: JSON.stringify(body) });
    return res.json();
  }, [url]);

  const del = useCallback(async (overrideUrl?: string) => {
    const token = localStorage.getItem('babirye_token');
    const delUrl = overrideUrl ?? url;
    if (!delUrl) throw new Error('No URL provided');
    const res = await fetch(delUrl, { method: 'DELETE', headers: { Authorization: token ? `Bearer ${token}` : '' } });
    return res.json();
  }, [url]);

  return { data, loading, error, refetch: fetchData, post, put, del };
}