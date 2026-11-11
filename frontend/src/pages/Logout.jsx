import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { logout as apiLogout } from '../api/auth';

export function Logout() {
  const { clearAuth } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        await apiLogout();
      } finally {
        clearAuth();
        navigate('/login', { replace: true });
      }
    })();
  }, [clearAuth, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <p className="text-slate-500">Signing out…</p>
    </div>
  );
}
