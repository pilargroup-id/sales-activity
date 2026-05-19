import { useEffect, useRef } from 'react';
import { logout } from './auth';
import { AUTH_UPDATED_EVENT } from './authEvents';

const POLL_INTERVAL = 5_000;
const STATUS_URL = `${import.meta.env.VITE_CENTRAL_PORTAL_API_URL || 'https://pilargroup.id'}/api/auth/status`;

function getStoredToken() {
  return localStorage.getItem('token') || null;
}

function getStoredCv() {
  const cv = localStorage.getItem('token_cv');
  return cv !== null ? Number(cv) : null;
}

function handleExpired() {
  logout();
  if (import.meta.env.VITE_MOCK_AUTH !== 'true') {
    window.location.href = import.meta.env.VITE_CENTRAL_PORTAL_URL || 'https://pilargroup.id/login';
  }
}

export function useSessionGuard() {
  const intervalRef = useRef(null);
  const startedRef = useRef(false);

  useEffect(() => {
    if (import.meta.env.VITE_MOCK_AUTH === 'true') return;

    const startPolling = () => {
      const token = getStoredToken();
      if (!token) return;
      if (startedRef.current) return; // sudah jalan, skip
      startedRef.current = true;

      const check = async () => {
        try {
          const res = await fetch(STATUS_URL, {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (res.status === 401) {
            handleExpired();
            return;
          }

          if (!res.ok) return;

          const data = await res.json();

          if (!data.valid) {
            handleExpired();
            return;
          }

          if (data.token_version !== undefined) {
            const storedCv = getStoredCv();
            if (storedCv === null || Number(storedCv) !== Number(data.token_version)) {
              handleExpired();
            }
          }

        } catch {
          // network error sementara, skip
        }
      };

      check();
      intervalRef.current = setInterval(check, POLL_INTERVAL);

      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
          check();
        }
      };
      document.addEventListener('visibilitychange', handleVisibilityChange);
    };

    // Coba start sekarang
    startPolling();

    // Kalau token belum ada, tunggu AUTH_UPDATED_EVENT (fired setelah consumeTokenFromUrl)
    window.addEventListener(AUTH_UPDATED_EVENT, startPolling);

    return () => {
      clearInterval(intervalRef.current);
      window.removeEventListener(AUTH_UPDATED_EVENT, startPolling);
      document.removeEventListener('visibilitychange', () => {});
    };
  }, []);
}