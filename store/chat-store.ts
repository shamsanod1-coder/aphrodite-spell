import { create } from "zustand";

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderType: "user" | "assistant";
  content: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  status: "sending" | "streaming" | "sent" | "error";
}

interface ChatState {
  conversationId: string | null;
  messages: ChatMessage[];
  isTyping: boolean;
  isStreaming: boolean;
  isLoadingHistory: boolean;
  hasMoreMessages: boolean;
  error: string | null;

  setConversationId: (id: string | null) => void;
  addMessage: (message: ChatMessage) => void;
  updateMessage: (id: string, updates: Partial<ChatMessage>) => void;
  setMessages: (messages: ChatMessage[]) => void;
  prependMessages: (messages: ChatMessage[]) => void;
  removeMessage: (id: string) => void;
  setTyping: (typing: boolean) => void;
  setStreaming: (streaming: boolean) => void;
  setLoadingHistory: (loading: boolean) => void;
  setHasMoreMessages: (hasMore: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  conversationId: null,
  messages: [],
  isTyping: false,
  isStreaming: false,
  isLoadingHistory: false,
  hasMoreMessages: true,
  error: null,

  setConversationId: (conversationId) => set({ conversationId }),

  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),

  updateMessage: (id, updates) =>
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === id ? { ...msg, ...updates } : msg
      ),
    })),

  setMessages: (messages) => set({ messages }),

  prependMessages: (messages) =>
    set((state) => ({ messages: [...messages, ...state.messages] })),

  removeMessage: (id) =>
    set((state) => ({
      messages: state.messages.filter((msg) => msg.id !== id),
    })),

  setTyping: (isTyping) => set({ isTyping }),
  setStreaming: (isStreaming) => set({ isStreaming }),
  setLoadingHistory: (isLoadingHistory) => set({ isLoadingHistory }),
  setHasMoreMessages: (hasMoreMessages) => set({ hasMoreMessages }),
  setError: (error) => set({ error }),

  reset: () =>
    set({
      conversationId: null,
      messages: [],
      isTyping: false,
      isStreaming: false,
      isLoadingHistory: false,
      hasMoreMessages: true,
      error: null,
    }),
}));
