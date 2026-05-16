"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/store/chat-store";

interface MessageBubbleProps {
  message: ChatMessage;
  onRetry?: () => void;
}

export function MessageBubble({ message, onRetry }: MessageBubbleProps) {
  const isUser = message.senderType === "user";
  const isError = message.status === "error";
  const isStreaming = message.status === "streaming";

  return (
    <div
      className={cn("flex w-full", isUser ? "justify-end" : "justify-start")}
    >
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-foreground",
          isError && "opacity-70"
        )}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{message.content}</p>
        ) : (
          <div className="prose prose-sm dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
            {message.content ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {message.content}
              </ReactMarkdown>
            ) : isStreaming ? (
              <span className="inline-block h-4 w-1 animate-pulse bg-foreground/50" />
            ) : null}
          </div>
        )}

        {isError && (
          <button
            onClick={onRetry}
            className="mt-1 text-xs text-destructive underline underline-offset-2"
          >
            Failed to send — tap to retry
          </button>
        )}
      </div>
    </div>
  );
}
