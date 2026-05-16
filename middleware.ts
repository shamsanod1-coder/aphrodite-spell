import { type NextRequest, NextResponse } from "next/server";

export async function middleware(_request: NextRequest) {
  // Better Auth manages sessions via cookies automatically through
  // the /api/auth/[...all] route handler.
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
