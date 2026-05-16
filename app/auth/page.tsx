"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";
import { signInWithMagicLink, linkEmailToAnonymousUser } from "@/services/auth";
import { trackAuthStarted } from "@/lib/posthog/events";
import { Button } from "@/components/ui/button";

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const isGuest = useAuthStore((s) => s.isGuest);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      trackAuthStarted("magic_link");

      if (isGuest) {
        await linkEmailToAnonymousUser(email);
      } else {
        await signInWithMagicLink(email);
      }

      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center px-4">
        <div className="mx-auto max-w-sm space-y-4 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Check your email</h1>
          <p className="text-sm text-muted-foreground">
            We sent a magic link to <strong>{email}</strong>. Click it to sign in.
          </p>
          <Button variant="ghost" size="sm" onClick={() => setSent(false)}>
            Try a different email
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[100dvh] items-center justify-center px-4">
      <div className="mx-auto w-full max-w-sm space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            {isGuest ? "Create your account" : "Sign in"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isGuest
              ? "Link your email to keep your conversations"
              : "Enter your email for a magic link"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            className="w-full rounded-xl border border-border bg-muted/50 px-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Sending..." : "Send magic link"}
          </Button>
        </form>

        <div className="text-center">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            Go back
          </Button>
        </div>
      </div>
    </div>
  );
}
