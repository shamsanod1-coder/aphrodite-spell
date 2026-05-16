import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center px-4">
      <div className="mx-auto max-w-sm space-y-4 text-center">
        <h2 className="text-xl font-semibold">Not found</h2>
        <p className="text-sm text-muted-foreground">This page does not exist.</p>
        <Link href="/" className={buttonVariants()}>
          Go home
        </Link>
      </div>
    </div>
  );
}
