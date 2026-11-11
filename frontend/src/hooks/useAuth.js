import { useAuthStore } from '../store/authStore';

export function useAuth() {
  const { user, accessToken, setAuth, clearAuth } = useAuthStore();
  const isAuthenticated = !!accessToken && !!user;
  const isSuperAdmin = user?.role === 'super_admin';
  const isAdmin = user?.role === 'admin' || isSuperAdmin;
  const isUser = user?.role === 'user';
  const isFieldUser = user?.designation === 'INTERNEE' || user?.designation === 'WCF';
  return { user, accessToken, isAuthenticated, isSuperAdmin, isAdmin, isUser, isFieldUser, setAuth, clearAuth };
}
