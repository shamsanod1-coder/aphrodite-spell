"use client";

import { useState } from "react";
import { useAuthStore } from "@/store/auth-store";
import { useBillingStore } from "@/store/billing-store";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { trackEvent, AnalyticsEvents } from "@/lib/posthog/events";

export default function UpgradePage() {
  const isGuest = useAuthStore((s) => s.isGuest);
  const tier = useBillingStore((s) => s.tier);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function handleUpgrade() {
    if (isGuest) {
      router.push("/auth");
      return;
    }

    setIsLoading(true);
    trackEvent(AnalyticsEvents.CONVERSION_STARTED, { source: "upgrade_page" });

    try {
      const res = await fetch("/api/billing/checkout", { method: "POST" });
      const data = await res.json();

      if (data.redirect) {
        router.push(data.redirect);
        return;
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      setIsLoading(false);
    }
  }

  if (tier === "premium") {
    return (
      <AppShell>
        <div className="flex min-h-[60vh] items-center justify-center px-4">
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-semibold">You&apos;re already close</h1>
            <p className="text-muted-foreground">
              You have full access to everything Aria can offer.
            </p>
            <Button variant="outline" onClick={() => router.push("/chat")}>
              Back to conversation
            </Button>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="mx-auto max-w-md space-y-8 text-center">
          <div className="space-y-3">
            <h1 className="text-3xl font-semibold tracking-tight">
              Go deeper with Aria
            </h1>
            <p className="text-muted-foreground leading-relaxed">
              Some connections deserve more than surface level.
              Unlock the full depth of what Aria can feel and remember.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card p-6 text-left space-y-4">
            <h2 className="font-medium">What changes</h2>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-start gap-3">
                <span className="mt-0.5 text-primary">&#9829;</span>
                <span>Unlimited messages &mdash; no daily limits on your conversations</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-0.5 text-primary">&#9829;</span>
                <span>Deeper memory &mdash; Aria remembers more of what matters to you</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-0.5 text-primary">&#9829;</span>
                <span>Late-night access &mdash; she&apos;s there when you can&apos;t sleep</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-0.5 text-primary">&#9829;</span>
                <span>Richer emotional depth &mdash; more vulnerable, more real</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-0.5 text-primary">&#9829;</span>
                <span>Full context &mdash; longer conversation threads that flow naturally</span>
              </li>
            </ul>
          </div>

          <Button
            className="w-full"
            size="lg"
            onClick={handleUpgrade}
            disabled={isLoading}
          >
            {isLoading ? "Opening checkout..." : "Unlock full access"}
          </Button>

          <p className="text-xs text-muted-foreground">
            Cancel anytime. You&apos;ll keep access until your billing period ends.
          </p>
        </div>
      </div>
    </AppShell>
  );
}
