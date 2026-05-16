import { createClient } from "@/lib/supabase/client";

export async function getOrCreateConversation(userId: string) {
  const supabase = createClient();

  const { data: existing, error: fetchError } = await supabase
    .from("conversations")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .single();

  if (existing && !fetchError) {
    return existing;
  }

  const { data: created, error: createError } = await supabase
    .from("conversations")
    .insert({ user_id: userId })
    .select()
    .single();

  if (createError) throw createError;
  return created;
}

export async function loadMessages(
  conversationId: string,
  limit = 50,
  before?: string
) {
  const supabase = createClient();

  let query = supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })
    .limit(limit);

  if (before) {
    query = query.lt("created_at", before);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function saveMessage(
  conversationId: string,
  senderType: "user" | "assistant",
  content: string,
  metadata?: Record<string, string | number | boolean | null>
) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("messages")
    .insert({
      conversation_id: conversationId,
      sender_type: senderType,
      content,
      metadata: metadata ?? null,
    })
    .select()
    .single();

  if (error) throw error;

  await supabase
    .from("conversations")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", conversationId);

  return data;
}

export async function updateMessage(messageId: string, content: string) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("messages")
    .update({ content })
    .eq("id", messageId)
    .select()
    .single();

  if (error) throw error;
  return data;
}
