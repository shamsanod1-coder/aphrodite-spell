import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import {
  getOrCreateConversation,
  listUserConversations,
} from "@/db/queries";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = req.nextUrl.searchParams;
  const limit = parseInt(searchParams.get("limit") ?? "50", 10);
  const offset = parseInt(searchParams.get("offset") ?? "0", 10);
  const includeArchived = searchParams.get("includeArchived") === "true";

  const rows = await listUserConversations(session.user.id, {
    includeArchived,
    limit,
    offset,
  });

  return Response.json(rows);
}

export async function POST() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const conversation = await getOrCreateConversation(session.user.id);
  return Response.json(conversation);
}
