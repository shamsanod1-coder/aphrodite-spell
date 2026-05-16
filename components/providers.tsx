"use client";

import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PostHogProvider } from "@/lib/posthog/provider";
import { authClient } from "@/lib/auth-client";
import { useAuthStore } from "@/store/auth-store";
import { useAppStore } from "@/store/app-store";
import { trackAppOpen } from "@/lib/posthog/events";
import { logger } from "@/lib/logger";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      retry: 1,
    },
  },
});

function AuthListener() {
  const setUser = useAuthStore((s) => s.setUser);
  const setSession = useAuthStore((s) => s.setSession);
  const setLoading = useAuthStore((s) => s.setLoading);

  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        const { data: sessionData } = await authClient.getSession();

        if (!mounted) return;

        if (sessionData) {
          setSession(sessionData.session);
          setUser(sessionData.user);
        } else {
          // Auto-create anonymous session for guest experience
          const { data, error } = await authClient.signIn.anonymous();
          if (error) {
            logger.error("Failed to create anonymous session", error);
          } else if (data) {
            setUser(data.user);
          }
        }
      } catch (error) {
        logger.error("Auth initialization failed", error);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    init();

    return () => {
      mounted = false;
    };
  }, [setUser, setSession, setLoading]);

  return null;
}

function ConnectivityMonitor() {
  const setOnline = useAppStore((s) => s.setOnline);

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [setOnline]);

  return null;
}

function AppInit() {
  const setLoading = useAppStore((s) => s.setLoading);

  useEffect(() => {
    trackAppOpen();
    setLoading(false);
  }, [setLoading]);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <PostHogProvider>
        <AuthListener />
        <ConnectivityMonitor />
        <AppInit />
        {children}
      </PostHogProvider>
    </QueryClientProvider>
  );
}
