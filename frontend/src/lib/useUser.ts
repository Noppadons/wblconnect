"use client";

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import type { User } from '@/lib/types';

let cachedUser: User | null = null;
let fetchPromise: Promise<User | null> | null = null;

async function fetchUserProfile(): Promise<User | null> {
  try {
    const res = await api.get('/auth/profile');
    const user = res.data;
    cachedUser = user;
    // Keep minimal data in sessionStorage for instant hydration
    if (typeof window !== 'undefined' && user) {
      sessionStorage.setItem('user', JSON.stringify({
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        avatarUrl: user.avatarUrl || null,
      }));
    }
    return user;
  } catch {
    cachedUser = null;
    return null;
  }
}

export function useUser() {
  const [user, setUser] = useState<User | null>(() => {
    // Instant hydration from sessionStorage (non-sensitive subset)
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem('user') || localStorage.getItem('user');
      if (stored) {
        try { return JSON.parse(stored); } catch { return null; }
      }
    }
    return cachedUser;
  });
  const [loading, setLoading] = useState(!cachedUser);

  useEffect(() => {
    if (cachedUser) {
      setUser(cachedUser);
      setLoading(false);
      return;
    }

    if (!fetchPromise) {
      fetchPromise = fetchUserProfile();
    }

    fetchPromise.then((u) => {
      setUser(u);
      setLoading(false);
      fetchPromise = null;
    });
  }, []);

  return { user, loading };
}

export function clearUserCache() {
  cachedUser = null;
  fetchPromise = null;
  if (typeof window !== 'undefined') {
    localStorage.removeItem('user');
    sessionStorage.removeItem('user');
  }
}
