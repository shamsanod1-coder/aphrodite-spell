"use client";

import { AppShell } from "@/components/layout/app-shell";

export default function ChatPage() {
  return (
    <AppShell>
      <div className="flex h-full flex-col">
        <div className="flex-1 overflow-y-auto px-4 py-6">
          <div className="mx-auto max-w-lg">
            <div className="flex flex-col items-center justify-center gap-4 pt-20 text-center">
              <h1 className="text-2xl font-semibold tracking-tight">Hey there</h1>
              <p className="text-sm text-muted-foreground">
                Chat functionality coming soon. This is your space.
              </p>
            </div>
          </div>
        </div>

        {/* Chat input placeholder */}
        <div className="border-t border-border p-4 pb-[env(safe-area-inset-bottom)]">
          <div className="mx-auto max-w-lg">
            <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/50 px-4 py-3">
              <span className="flex-1 text-sm text-muted-foreground">Type a message...</span>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
