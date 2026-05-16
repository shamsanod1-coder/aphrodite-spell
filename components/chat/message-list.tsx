"use client";

import { useRef, useCallback } from "react";
import { Virtuoso, type VirtuosoHandle } from "react-virtuoso";
import { MessageBubble } from "./message-bubble";
import { TypingIndicator } from "./typing-indicator";
import type { ChatMessage } from "@/store/chat-store";

interface MessageListProps {
  messages: ChatMessage[];
  isStreaming: boolean;
  onLoadMore: () => void;
  onRetry: () => void;
}

export function MessageList({
  messages,
  isStreaming,
  onLoadMore,
  onRetry,
}: MessageListProps) {
  const virtuosoRef = useRef<VirtuosoHandle>(null);

  const renderItem = useCallback(
    (_index: number, message: ChatMessage) => (
      <div className="px-4 py-1">
        <MessageBubble message={message} onRetry={onRetry} />
      </div>
    ),
    [onRetry]
  );

  const header = useCallback(
    () =>
      isStreaming && messages[messages.length - 1]?.content === "" ? (
        <div className="px-4 py-1">
          <TypingIndicator />
        </div>
      ) : null,
    [isStreaming, messages]
  );

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 pt-20 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Hey there</h1>
        <p className="text-sm text-muted-foreground">
          Say something. I&apos;m listening.
        </p>
      </div>
    );
  }

  return (
    <Virtuoso
      ref={virtuosoRef}
      data={messages}
      itemContent={renderItem}
      components={{ Footer: header }}
      followOutput="smooth"
      initialTopMostItemIndex={Math.max(0, messages.length - 1)}
      startReached={onLoadMore}
      className="flex-1"
      increaseViewportBy={{ top: 200, bottom: 200 }}
    />
  );
}
