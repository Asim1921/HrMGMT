import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const initialTokens =
  typeof window === 'undefined'
    ? { accessToken: null, refreshToken: null }
    : {
        accessToken: localStorage.getItem('accessToken'),
        refreshToken: localStorage.getItem('refreshToken'),
      };

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      accessToken: initialTokens.accessToken,
      refreshToken: initialTokens.refreshToken,
      setAuth: (user, accessToken, refreshToken) => {
        if (accessToken) localStorage.setItem('accessToken', accessToken);
        if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
        set({ user, accessToken, refreshToken });
      },
      clearAuth: () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        set({ user: null, accessToken: null, refreshToken: null });
      },
    }),
    {
      name: '101hrmgmt-auth',
      // Persist user + tokens so refresh / direct URL keeps the session
      partialize: (s) => ({
        user: s.user,
        accessToken: s.accessToken,
        refreshToken: s.refreshToken,
      }),
    }
  )
);

if (typeof window !== 'undefined') {
  window.addEventListener('auth:logout', () => useAuthStore.getState().clearAuth());
}
