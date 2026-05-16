import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface User {
  _id: string;
  username: string;
  email: string;
  avatarColor: string;
}

interface AuthState {
  user:            User | null;
  token:           string | null;
  isAuthenticated: boolean;
  isLoading:       boolean;
  setAuth:         (user: User, token: string) => void;
  clearAuth:       () => void;
  setLoading:      (v: boolean) => void;
}

/* Decode JWT expiry without a library */
const isTokenExpired = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user:            null,
      token:           null,
      isAuthenticated: false,
      isLoading:       false,

      setAuth: (user, token) =>
        set({ user, token, isAuthenticated: true, isLoading: false }),

      clearAuth: () =>
        set({ user: null, token: null, isAuthenticated: false }),

      setLoading: (isLoading) => set({ isLoading }),
    }),
    {
      name: 'pinboard-auth',
      storage: createJSONStorage(() => localStorage),
      /* After rehydration, check if stored token is still valid */
      onRehydrateStorage: () => (state) => {
        if (state?.token && isTokenExpired(state.token)) {
          state.clearAuth();
        } else if (state?.token) {
          state.isAuthenticated = true;
        }
      },
      partialize: (s) => ({ user: s.user, token: s.token }),
    }
  )
);
