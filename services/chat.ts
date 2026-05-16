export interface ConversationRow {
  id: string;
  userId: string;
  relationshipStage: string;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MessageRow {
  id: string;
  conversationId: string;
  senderType: "user" | "assistant";
  content: string;
  metadata: unknown;
  tokenCount: number | null;
  createdAt: string;
}

export async function getOrCreateConversation(): Promise<ConversationRow> {
  const res = await fetch("/api/conversations", { method: "POST" });
  if (!res.ok) throw new Error("Failed to get/create conversation");
  return res.json();
}

export async function loadMessages(
  conversationId: string,
  limit = 50,
  before?: string
): Promise<MessageRow[]> {
  const params = new URLSearchParams({ conversationId, limit: String(limit) });
  if (before) params.set("before", before);

  const res = await fetch(`/api/messages?${params}`);
  if (!res.ok) throw new Error("Failed to load messages");
  return res.json();
}

export async function saveMessage(
  conversationId: string,
  senderType: "user" | "assistant",
  content: string,
  metadata?: Record<string, string | number | boolean | null>
): Promise<MessageRow> {
  const res = await fetch("/api/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ conversationId, senderType, content, metadata }),
  });
  if (!res.ok) throw new Error("Failed to save message");
  return res.json();
}

export async function updateMessage(
  messageId: string,
  conversationId: string,
  content: string
): Promise<MessageRow> {
  const res = await fetch("/api/messages", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messageId, conversationId, content }),
  });
  if (!res.ok) throw new Error("Failed to update message");
  return res.json();
}

export interface ListConversationsOptions {
  limit?: number;
  offset?: number;
  includeArchived?: boolean;
}

export async function listUserConversations(
  options: ListConversationsOptions = {}
): Promise<ConversationRow[]> {
  const params = new URLSearchParams();
  if (options.limit) params.set("limit", String(options.limit));
  if (options.offset) params.set("offset", String(options.offset));
  if (options.includeArchived) params.set("includeArchived", "true");

  const res = await fetch(`/api/conversations?${params}`);
  if (!res.ok) throw new Error("Failed to list conversations");
  return res.json();
}
