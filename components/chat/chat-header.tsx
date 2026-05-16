"use client";

import { companion } from "@/lib/companion";

export function ChatHeader() {
  return (
    <div className="flex items-center gap-3 border-b border-border px-4 py-3">
      <div className="relative">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
          {companion.name.charAt(0)}
        </div>
        <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-background bg-emerald-500" />
      </div>
      <div className="flex flex-col">
        <span className="text-sm font-medium leading-tight">
          {companion.name}
        </span>
        <span className="text-xs text-muted-foreground">
          {companion.tagline}
        </span>
      </div>
    </div>
  );
}
