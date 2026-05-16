"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-[100dvh] bg-[#0a0a0a] text-[#fafafa]">
        <div className="flex min-h-[100dvh] items-center justify-center px-4">
          <div className="mx-auto max-w-sm space-y-4 text-center">
            <h2 className="text-xl font-semibold">Something went wrong</h2>
            <p className="text-sm text-[#a1a1aa]">A critical error occurred.</p>
            <button
              onClick={reset}
              className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black"
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
