"use client";

import { ArrowDown } from "lucide-react";
import { useEffect, useState, type RefObject } from "react";

import { Button } from "@sidekiq/components/ui/button";
import { cn } from "@sidekiq/lib/utils";

interface ScrollToBottomProps {
  /** Reference to the scroll container */
  scrollContainer: RefObject<HTMLDivElement | null>;
  /** Threshold in pixels from bottom to show button */
  threshold?: number;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Floating button that appears when user scrolls away from the bottom.
 * Clicking scrolls smoothly to the bottom of the container.
 */
export function ScrollToBottom({
  scrollContainer,
  threshold = 200,
  className,
}: ScrollToBottomProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const container = scrollContainer.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
      setIsVisible(distanceFromBottom > threshold);
    };

    // Initial check
    handleScroll();

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, [scrollContainer, threshold]);

  const scrollToBottom = () => {
    const container = scrollContainer.current;
    if (!container) return;

    container.scrollTo({
      top: container.scrollHeight,
      behavior: "smooth",
    });
  };

  if (!isVisible) return null;

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={scrollToBottom}
      className={cn(
        "fixed right-8 bottom-24 z-10",
        "rounded-full shadow-lg",
        "border-border/50",
        "transition-transform hover:scale-105",
        className,
      )}
      aria-label="Scroll to bottom"
    >
      <ArrowDown className="h-4 w-4" />
    </Button>
  );
}
