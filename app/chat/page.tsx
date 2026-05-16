"use client";

import { AppShell } from "@/components/layout/app-shell";
import { ChatHeader } from "@/components/chat/chat-header";
import { MessageList } from "@/components/chat/message-list";
import { ChatInput } from "@/components/chat/chat-input";
import { useChatController } from "@/hooks/use-chat";
import { useChatStore } from "@/store/chat-store";

export default function ChatPage() {
  const { messages, isStreaming, sendMessage, loadMoreMessages, retry } =
    useChatController();
  const error = useChatStore((s) => s.error);

  return (
    <AppShell>
      <div className="flex h-full flex-col">
        <ChatHeader />

        <div className="relative flex flex-1 flex-col overflow-hidden">
          <MessageList
            messages={messages}
            isStreaming={isStreaming}
            onLoadMore={loadMoreMessages}
            onRetry={retry}
          />
        </div>

        {error && (
          <div className="border-t border-destructive/20 bg-destructive/5 px-4 py-2">
            <p className="text-center text-xs text-destructive">{error}</p>
          </div>
        )}

        <ChatInput onSend={sendMessage} disabled={isStreaming} />
      </div>
    </AppShell>
  );
}
