import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { conversations, messages } from "@/db/schema";
import { eq, and, asc, lt } from "drizzle-orm";
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
  const before = searchParams.get("before");

  if (!conversationId) {
    return Response.json({ error: "Missing conversationId" }, { status: 400 });
  }

  // Verify ownership
  const [conversation] = await db
    .select({ id: conversations.id })
    .from(conversations)
    .where(
      and(
        eq(conversations.id, conversationId),
        eq(conversations.userId, session.user.id)
      )
    )
    .limit(1);

  if (!conversation) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const conditions = [eq(messages.conversationId, conversationId)];
  if (before) {
    conditions.push(lt(messages.createdAt, new Date(before)));
  }

  const rows = await db
    .select()
    .from(messages)
    .where(and(...conditions))
    .orderBy(asc(messages.createdAt))
    .limit(limit);

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
    metadata?: Record<string, string | number | boolean | null>;
  };

  // Verify ownership
  const [conversation] = await db
    .select({ id: conversations.id })
    .from(conversations)
    .where(
      and(
        eq(conversations.id, body.conversationId),
        eq(conversations.userId, session.user.id)
      )
    )
    .limit(1);

  if (!conversation) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const [saved] = await db
    .insert(messages)
    .values({
      conversationId: body.conversationId,
      senderType: body.senderType,
      content: body.content,
      metadata: body.metadata ?? null,
    })
    .returning();

  await db
    .update(conversations)
    .set({ updatedAt: new Date() })
    .where(eq(conversations.id, body.conversationId));

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
    content: string;
  };

  const [updated] = await db
    .update(messages)
    .set({ content: body.content })
    .where(eq(messages.id, body.messageId))
    .returning();

  return Response.json(updated);
}
