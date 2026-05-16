"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export function useScrollAnchor() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [autoScroll, setAutoScroll] = useState(true);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const scrollToBottomInstant = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "instant" });
  }, []);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    function handleScroll() {
      if (!container) return;
      const { scrollTop, scrollHeight, clientHeight } = container;
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
      const atBottom = distanceFromBottom < 60;
      setIsAtBottom(atBottom);
      setAutoScroll(atBottom);
    }

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (autoScroll) {
      scrollToBottom();
    }
  });

  return {
    scrollRef,
    bottomRef,
    isAtBottom,
    autoScroll,
    scrollToBottom,
    scrollToBottomInstant,
  };
}
