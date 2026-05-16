"use client";

import { useCallback, useEffect, useRef } from "react";
import { useChat as useAIChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useChatStore, type ChatMessage } from "@/store/chat-store";
import { useAuthStore } from "@/store/auth-store";
import {
  getOrCreateConversation,
  loadMessages,
  saveMessage,
} from "@/services/chat";
import { trackEvent, AnalyticsEvents } from "@/lib/posthog/events";

function getTextContent(message: UIMessage): string {
  return message.parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("");
}

function apiRowToChatMessage(
  row: {
    id: string;
    conversationId: string;
    senderType: "user" | "assistant";
    content: string;
    metadata: unknown;
    createdAt: string;
  },
  status: ChatMessage["status"] = "sent"
): ChatMessage {
  return {
    id: row.id,
    conversationId: row.conversationId,
    senderType: row.senderType,
    content: row.content,
    metadata: (row.metadata as Record<string, unknown>) ?? null,
    createdAt: row.createdAt,
    status,
  };
}

export function useChatController() {
  const user = useAuthStore((s) => s.user);
  const {
    conversationId,
    messages: storeMessages,
    isStreaming,
    hasMoreMessages,
    setConversationId,
    addMessage,
    updateMessage,
    setMessages,
    prependMessages,
    setStreaming,
    setLoadingHistory,
    setHasMoreMessages,
    setError,
  } = useChatStore();

  const initRef = useRef(false);
  const isSendingRef = useRef(false);

  const {
    messages: aiMessages,
    sendMessage: aiSendMessage,
    status: aiStatus,
    error: aiError,
  } = useAIChat({
    id: conversationId ?? undefined,
    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: { conversationId },
    }),
    onFinish: async ({ message }) => {
      if (!conversationId) return;
      const text = getTextContent(message);
      try {
        await saveMessage(conversationId, "assistant", text);
      } catch {
        // Message was streamed to UI but failed to persist — non-fatal
      }
      setStreaming(false);
      isSendingRef.current = false;
    },
    onError: () => {
      setStreaming(false);
      setError("Failed to get a response. Tap to retry.");
      isSendingRef.current = false;
    },
  });

  // Sync AI SDK streaming messages into our store
  useEffect(() => {
    if (!aiMessages.length || !conversationId) return;
    const lastAiMsg = aiMessages[aiMessages.length - 1];
    if (lastAiMsg.role !== "assistant") return;

    const text = getTextContent(lastAiMsg);
    const existingStreaming = storeMessages.find(
      (m) => m.status === "streaming"
    );
    if (existingStreaming) {
      updateMessage(existingStreaming.id, { content: text });
    }
  }, [aiMessages, conversationId, storeMessages, updateMessage]);

  // Initialize conversation on mount
  useEffect(() => {
    if (!user || initRef.current) return;
    initRef.current = true;

    async function init() {
      try {
        const conversation = await getOrCreateConversation();
        setConversationId(conversation.id);

        const msgs = await loadMessages(conversation.id);
        const chatMessages = msgs.map((m) => apiRowToChatMessage(m));
        setMessages(chatMessages);
        setHasMoreMessages(msgs.length >= 50);

        trackEvent(AnalyticsEvents.CONVERSATION_STARTED, {
          conversation_id: conversation.id,
          message_count: msgs.length,
        });
      } catch {
        setError("Failed to load conversation");
      }
    }

    init();
  }, [user, setConversationId, setMessages, setHasMoreMessages, setError]);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!conversationId || !content.trim() || isSendingRef.current) return;
      isSendingRef.current = true;

      const tempId = `temp-${Date.now()}`;
      const userMessage: ChatMessage = {
        id: tempId,
        conversationId,
        senderType: "user",
        content: content.trim(),
        metadata: null,
        createdAt: new Date().toISOString(),
        status: "sending",
      };

      addMessage(userMessage);
      setError(null);

      try {
        const saved = await saveMessage(conversationId, "user", content.trim());
        updateMessage(tempId, { id: saved.id, status: "sent" });

        trackEvent(AnalyticsEvents.MESSAGE_SENT, {
          conversation_id: conversationId,
        });
      } catch {
        updateMessage(tempId, { status: "error" });
        setError("Failed to send message");
        isSendingRef.current = false;
        return;
      }

      // Add placeholder for assistant response
      const assistantTempId = `assistant-temp-${Date.now()}`;
      const assistantPlaceholder: ChatMessage = {
        id: assistantTempId,
        conversationId,
        senderType: "assistant",
        content: "",
        metadata: null,
        createdAt: new Date().toISOString(),
        status: "streaming",
      };
      addMessage(assistantPlaceholder);
      setStreaming(true);

      // Trigger AI response via AI SDK
      aiSendMessage({ text: content.trim() });
    },
    [
      conversationId,
      addMessage,
      updateMessage,
      setStreaming,
      setError,
      aiSendMessage,
    ]
  );

  const loadMoreMessages = useCallback(async () => {
    if (!conversationId || !hasMoreMessages) return;

    setLoadingHistory(true);
    try {
      const oldest = storeMessages[0];
      const olderMsgs = await loadMessages(
        conversationId,
        50,
        oldest?.createdAt
      );
      if (olderMsgs.length < 50) setHasMoreMessages(false);
      if (olderMsgs.length > 0) {
        prependMessages(olderMsgs.map((m) => apiRowToChatMessage(m)));
      }
    } catch {
      setError("Failed to load older messages");
    } finally {
      setLoadingHistory(false);
    }
  }, [
    conversationId,
    hasMoreMessages,
    storeMessages,
    setLoadingHistory,
    setHasMoreMessages,
    prependMessages,
    setError,
  ]);

  const retry = useCallback(async () => {
    const lastUserMsg = [...storeMessages]
      .reverse()
      .find((m) => m.senderType === "user");
    if (!lastUserMsg) return;

    // Remove any error assistant messages
    const lastMsg = storeMessages[storeMessages.length - 1];
    if (lastMsg.senderType === "assistant" && lastMsg.status === "error") {
      const filtered = storeMessages.filter((m) => m.id !== lastMsg.id);
      setMessages(filtered);
    }

    setError(null);
    setStreaming(true);
    isSendingRef.current = true;

    const assistantTempId = `assistant-retry-${Date.now()}`;
    addMessage({
      id: assistantTempId,
      conversationId: conversationId!,
      senderType: "assistant",
      content: "",
      metadata: null,
      createdAt: new Date().toISOString(),
      status: "streaming",
    });

    aiSendMessage({ text: lastUserMsg.content });
  }, [
    storeMessages,
    conversationId,
    setMessages,
    setError,
    setStreaming,
    addMessage,
    aiSendMessage,
  ]);

  return {
    messages: storeMessages,
    isStreaming,
    isLoading: aiStatus === "streaming" || aiStatus === "submitted",
    error: aiError,
    sendMessage,
    loadMoreMessages,
    retry,
  };
}
