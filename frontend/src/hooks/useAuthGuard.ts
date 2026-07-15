'use client';

/**
 * MediLink AI — useAuthGuard hook
 *
 * Client-side auth guard that complements the middleware.
 * Reads the stored user, validates the token exists, and
 * returns the current user object. Redirects to /auth if missing.
 *
 * Usage:
 *   const { user, loading } = useAuthGuard();
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getStoredUser, isAuthenticated, clearTokens, StoredUser } from '../lib/auth';

interface UseAuthGuardReturn {
  user: StoredUser | null;
  loading: boolean;
}

export function useAuthGuard(requiredRole?: string): UseAuthGuardReturn {
  const router = useRouter();
  const [user, setUser] = useState<StoredUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = getStoredUser();

    if (!isAuthenticated() || !stored) {
      clearTokens();
      router.replace('/auth');
      return;
    }

    // Optional role check
    if (requiredRole && stored.role !== requiredRole) {
      router.replace('/auth');
      return;
    }

    setUser(stored);
    setLoading(false);
  }, [router, requiredRole]);

  return { user, loading };
}
