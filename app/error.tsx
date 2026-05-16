"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { logger } from "@/lib/logger";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error("Route error boundary caught error", error);
  }, [error]);

  return (
    <div className="flex min-h-[100dvh] items-center justify-center px-4">
      <div className="mx-auto max-w-sm space-y-4 text-center">
        <h2 className="text-xl font-semibold">Something went wrong</h2>
        <p className="text-sm text-muted-foreground">An unexpected error occurred.</p>
        <Button onClick={reset}>Try again</Button>
      </div>
    </div>
  );
}
