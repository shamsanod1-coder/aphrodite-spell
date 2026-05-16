import { NextResponse } from "next/server";

export async function GET(request: Request) {
  // Better Auth handles magic link verification internally via
  // /api/auth/[...all]. This route now simply redirects to chat.
  const { searchParams, origin } = new URL(request.url);
  const next = searchParams.get("next") ?? "/chat";
  return NextResponse.redirect(`${origin}${next}`);
}
