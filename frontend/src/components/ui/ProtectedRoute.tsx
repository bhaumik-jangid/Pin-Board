import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';

interface Props { children: React.ReactNode; }

export function ProtectedRoute({ children }: Props) {
  /*
    Zustand persist rehydrates asynchronously from localStorage.
    Without this guard, the component renders before the token is loaded
    and immediately redirects to /login on every refresh.
  */
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    /* useAuthStore.persist.hasHydrated() is true once storage is read */
    const unsub = useAuthStore.persist.onFinishHydration(() => setHydrated(true));
    if (useAuthStore.persist.hasHydrated()) setHydrated(true);
    return unsub;
  }, []);

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const token           = useAuthStore((s) => s.token);

  if (!hydrated) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#c49a45',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{
          background: 'rgba(255,255,255,0.82)', backdropFilter: 'blur(12px)',
          borderRadius: '16px', padding: '20px 32px',
          fontSize: '14px', color: '#5a3e1b', fontWeight: 500,
        }}>
          Loading…
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
