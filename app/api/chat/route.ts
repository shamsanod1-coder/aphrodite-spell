import {
  streamText,
  type UIMessage,
  convertToModelMessages,
} from "ai";
import { getModel, SYSTEM_PROMPT } from "@/services/ai";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { messages, conversationId } = (await req.json()) as {
    messages: UIMessage[];
    conversationId: string;
  };

  const { count } = await supabase
    .from("conversations")
    .select("id", { count: "exact", head: true })
    .eq("id", conversationId)
    .eq("user_id", user.id);

  if (!count) {
    return new Response("Conversation not found", { status: 404 });
  }

  const modelMessages = await convertToModelMessages(messages);

  const result = streamText({
    model: getModel(),
    system: SYSTEM_PROMPT,
    messages: modelMessages,
  });

  return result.toUIMessageStreamResponse();
}
