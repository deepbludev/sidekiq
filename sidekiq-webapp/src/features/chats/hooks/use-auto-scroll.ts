import { useCallback, useRef, type RefObject } from "react";

interface UseAutoScrollOptions {
  /** Threshold in pixels from bottom to consider "at bottom" */
  threshold?: number;
}

interface UseAutoScrollReturn {
  /** Whether the user is currently near the bottom of the scroll container */
  isAtBottom: boolean;
  /** Function to scroll to the bottom of the container */
  scrollToBottom: (behavior?: ScrollBehavior) => void;
  /** Function to check and update the isAtBottom state */
  checkIsAtBottom: () => boolean;
}

/**
 * Custom hook for managing auto-scroll behavior in a scrollable container.
 *
 * Tracks whether the user is near the bottom of the scroll container
 * and provides functions to scroll to bottom.
 *
 * @param containerRef - Reference to the scrollable container element
 * @param options - Configuration options
 * @returns Object with isAtBottom state and scroll functions
 *
 * @example
 * ```tsx
 * const scrollRef = useRef<HTMLDivElement>(null);
 * const { isAtBottom, scrollToBottom } = useAutoScroll(scrollRef);
 *
 * useEffect(() => {
 *   if (isStreaming && isAtBottom) {
 *     scrollToBottom('smooth');
 *   }
 * }, [messages.length, isStreaming]);
 * ```
 */
export function useAutoScroll(
  containerRef: RefObject<HTMLDivElement | null>,
  options: UseAutoScrollOptions = {},
): UseAutoScrollReturn {
  const { threshold = 100 } = options;
  const isAtBottomRef = useRef(true);

  const checkIsAtBottom = useCallback(() => {
    const container = containerRef.current;
    if (!container) return true;

    const { scrollTop, scrollHeight, clientHeight } = container;
    const isBottom = scrollHeight - scrollTop - clientHeight < threshold;
    isAtBottomRef.current = isBottom;
    return isBottom;
  }, [containerRef, threshold]);

  const scrollToBottom = useCallback(
    (behavior: ScrollBehavior = "smooth") => {
      const container = containerRef.current;
      if (!container) return;

      container.scrollTo({
        top: container.scrollHeight,
        behavior,
      });
      isAtBottomRef.current = true;
    },
    [containerRef],
  );

  return {
    get isAtBottom() {
      return isAtBottomRef.current;
    },
    scrollToBottom,
    checkIsAtBottom,
  };
}
