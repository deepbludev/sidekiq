"use client";

import { useEffect, useRef, type RefObject } from "react";

interface ChatScrollAnchorProps {
  /** Whether the AI is currently streaming */
  isStreaming: boolean;
  /** Number of messages in the chat */
  messagesLength: number;
  /** Reference to the scroll container */
  scrollContainer: RefObject<HTMLDivElement | null>;
}

/**
 * Invisible anchor element that enables smart auto-scrolling behavior.
 *
 * Uses Intersection Observer to detect when user is near the bottom.
 * Auto-scrolls during streaming only if user hasn't scrolled up.
 */
export function ChatScrollAnchor({
  isStreaming,
  messagesLength,
  scrollContainer,
}: ChatScrollAnchorProps) {
  const anchorRef = useRef<HTMLDivElement>(null);
  const isAtBottomRef = useRef(true);

  // Track if user is near bottom
  useEffect(() => {
    const container = scrollContainer.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      // Consider "at bottom" if within 100px of bottom
      isAtBottomRef.current = scrollHeight - scrollTop - clientHeight < 100;
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, [scrollContainer]);

  // Auto-scroll when streaming and user is at bottom
  useEffect(() => {
    if (isStreaming && isAtBottomRef.current && anchorRef.current) {
      anchorRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [isStreaming, messagesLength]);

  // Scroll to bottom when new message arrives (user sends message)
  useEffect(() => {
    if (messagesLength > 0 && anchorRef.current) {
      // Small delay to ensure DOM has updated
      requestAnimationFrame(() => {
        anchorRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
      });
    }
  }, [messagesLength]);

  return <div ref={anchorRef} className="h-px" aria-hidden="true" />;
}
