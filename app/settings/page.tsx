"use client";

import { useAuthStore } from "@/store/auth-store";
import { signOut } from "@/services/auth";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const user = useAuthStore((s) => s.user);
  const isGuest = useAuthStore((s) => s.isGuest);
  const router = useRouter();

  async function handleSignOut() {
    await signOut();
    router.push("/");
  }

  return (
    <AppShell>
      <div className="px-4 py-6">
        <div className="mx-auto max-w-lg space-y-8">
          <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>

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

            {!isGuest && (
              <Button variant="outline" className="w-full" onClick={handleSignOut}>
                Sign out
              </Button>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
