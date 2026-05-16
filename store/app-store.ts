import { create } from "zustand";

interface AppState {
  isLoading: boolean;
  isOnline: boolean;
  featureFlags: Record<string, boolean>;
  setLoading: (loading: boolean) => void;
  setOnline: (online: boolean) => void;
  setFeatureFlag: (key: string, value: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  isLoading: true,
  isOnline: true,
  featureFlags: {},
  setLoading: (isLoading) => set({ isLoading }),
  setOnline: (isOnline) => set({ isOnline }),
  setFeatureFlag: (key, value) =>
    set((state) => ({
      featureFlags: { ...state.featureFlags, [key]: value },
    })),
}));
