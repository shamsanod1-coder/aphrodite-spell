import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import {
  createMessage,
  paginateMessages,
  updateMessageContent,
  verifyMessageOwnership,
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
  const conversationId = searchParams.get("conversationId");
  const limit = parseInt(searchParams.get("limit") ?? "50", 10);
  const before = searchParams.get("before") ?? undefined;

  if (!conversationId) {
    return Response.json({ error: "Missing conversationId" }, { status: 400 });
  }

  const isOwner = await verifyMessageOwnership(conversationId, session.user.id);
  if (!isOwner) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const rows = await paginateMessages({ conversationId, limit, before });
  return Response.json(rows);
}

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as {
    conversationId: string;
    senderType: "user" | "assistant";
    content: string;
    metadata?: Record<string, unknown>;
    tokenCount?: number;
  };

  const isOwner = await verifyMessageOwnership(
    body.conversationId,
    session.user.id
  );
  if (!isOwner) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const saved = await createMessage({
    conversationId: body.conversationId,
    senderType: body.senderType,
    content: body.content,
    metadata: body.metadata,
    tokenCount: body.tokenCount,
  });

  return Response.json(saved);
}

export async function PATCH(req: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as {
    messageId: string;
    conversationId: string;
    content: string;
  };

  const isOwner = await verifyMessageOwnership(
    body.conversationId,
    session.user.id
  );
  if (!isOwner) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const updated = await updateMessageContent(body.messageId, body.content);
  return Response.json(updated);
}
