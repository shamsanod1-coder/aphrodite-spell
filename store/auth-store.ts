import { create } from "zustand";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image?: string | null;
  isAnonymous?: boolean | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthSession {
  token: string;
  userId: string;
  expiresAt: Date;
}

interface AuthState {
  user: AuthUser | null;
  session: AuthSession | null;
  isGuest: boolean;
  isLoading: boolean;
  setUser: (user: AuthUser | null) => void;
  setSession: (session: AuthSession | null) => void;
  setLoading: (loading: boolean) => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  isGuest: false,
  isLoading: true,
  setUser: (user) =>
    set({
      user,
      isGuest: user?.isAnonymous ?? false,
    }),
  setSession: (session) => set({ session }),
  setLoading: (isLoading) => set({ isLoading }),
  reset: () =>
    set({
      user: null,
      session: null,
      isGuest: false,
      isLoading: false,
    }),
}));
