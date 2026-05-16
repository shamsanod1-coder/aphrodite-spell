export interface ConversationRow {
  id: string;
  userId: string;
  relationshipStage: string;
  createdAt: string;
  updatedAt: string;
}

export interface MessageRow {
  id: string;
  conversationId: string;
  senderType: "user" | "assistant";
  content: string;
  metadata: unknown;
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
  content: string
): Promise<MessageRow> {
  const res = await fetch("/api/messages", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messageId, content }),
  });
  if (!res.ok) throw new Error("Failed to update message");
  return res.json();
}
