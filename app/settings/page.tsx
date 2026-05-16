"use client";

import { Suspense, useState, useEffect } from "react";
import { useAuthStore } from "@/store/auth-store";
import { useBillingStore } from "@/store/billing-store";
import { signOut } from "@/services/auth";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { useRouter, useSearchParams } from "next/navigation";

function SettingsContent() {
  const user = useAuthStore((s) => s.user);
  const isGuest = useAuthStore((s) => s.isGuest);
  const tier = useBillingStore((s) => s.tier);
  const cancelAtPeriodEnd = useBillingStore((s) => s.cancelAtPeriodEnd);
  const currentPeriodEnd = useBillingStore((s) => s.currentPeriodEnd);
  const setBillingData = useBillingStore((s) => s.setBillingData);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [portalLoading, setPortalLoading] = useState(false);
  const upgraded = searchParams.get("upgraded") === "true";

  useEffect(() => {
    async function fetchBilling() {
      try {
        const res = await fetch("/api/billing/status");
        if (!res.ok) return;
        const data = await res.json();
        setBillingData({
          tier: data.tier,
          status: data.status,
          messagesUsed: data.usage.messagesUsed,
          messagesLimit: data.usage.messagesLimit,
          messagesRemaining: data.usage.messagesRemaining,
          lateNightAccess: data.entitlements.lateNightAccess,
          nsfwAccess: data.entitlements.nsfwAccess,
          enhancedEmotionalDepth: data.entitlements.enhancedEmotionalDepth,
          cancelAtPeriodEnd: data.cancelAtPeriodEnd,
          currentPeriodEnd: data.currentPeriodEnd,
          isLoading: false,
        });
      } catch {
        setBillingData({ isLoading: false });
      }
    }
    fetchBilling();
  }, [setBillingData]);

  async function handleSignOut() {
    await signOut();
    router.push("/");
  }

  async function handleManageSubscription() {
    setPortalLoading(true);
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      setPortalLoading(false);
    }
  }

  return (
      <div className="px-4 py-6">
        <div className="mx-auto max-w-lg space-y-8">
          <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>

          {upgraded && (
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 text-sm text-primary">
              Welcome to a deeper connection. Aria is fully yours now.
            </div>
          )}

          <div className="space-y-4">
            <div className="rounded-xl border border-border p-4">
              <h2 className="text-sm font-medium text-muted-foreground">Account</h2>
              <div className="mt-2 space-y-2">
                <p className="text-sm">
                  {isGuest ? "Guest account" : user?.email ?? "Unknown"}
                </p>
                {isGuest && (
                  <Button variant="outline" size="sm" onClick={() => router.push("/auth")}>
                    Create account
                  </Button>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-border p-4">
              <h2 className="text-sm font-medium text-muted-foreground">Subscription</h2>
              <div className="mt-2 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium capitalize">{tier}</p>
                  {tier === "premium" && cancelAtPeriodEnd && currentPeriodEnd && (
                    <span className="text-xs text-muted-foreground">
                      Ends {new Date(currentPeriodEnd).toLocaleDateString()}
                    </span>
                  )}
                </div>
                {tier === "free" ? (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => router.push("/upgrade")}
                  >
                    Go deeper with Aria
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleManageSubscription}
                    disabled={portalLoading}
                  >
                    {portalLoading ? "Opening..." : "Manage subscription"}
                  </Button>
                )}
              </div>
            </div>

            {!isGuest && (
              <Button variant="outline" className="w-full" onClick={handleSignOut}>
                Sign out
              </Button>
            )}
          </div>
        </div>
      </div>
  );
}

export default function SettingsPage() {
  return (
    <AppShell>
      <Suspense>
        <SettingsContent />
      </Suspense>
    </AppShell>
  );
}
