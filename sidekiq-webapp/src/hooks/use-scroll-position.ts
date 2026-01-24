import { useEffect, useRef, type RefObject } from "react";

/**
 * Hook to preserve scroll position of a scrollable container.
 *
 * Stores position in a ref (not state) to avoid re-renders.
 * Restores position on mount using requestAnimationFrame for reliable
 * restoration after DOM updates.
 *
 * @param containerRef - Ref to the scrollable container element
 * @returns The scroll position ref (for external access if needed)
 *
 * @example
 * ```tsx
 * const containerRef = useRef<HTMLDivElement>(null);
 * useScrollPosition(containerRef);
 *
 * return (
 *   <div ref={containerRef} className="h-full overflow-auto">
 *     {children}
 *   </div>
 * );
 * ```
 */
export function useScrollPosition(
  containerRef: RefObject<HTMLDivElement | null>,
) {
  const scrollPositionRef = useRef<number>(0);

  // Save position on scroll
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      scrollPositionRef.current = container.scrollTop;
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, [containerRef]);

  // Restore position on mount
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Use requestAnimationFrame for reliable restoration after render
    requestAnimationFrame(() => {
      container.scrollTop = scrollPositionRef.current;
    });
    // Only run on mount - intentionally empty deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return scrollPositionRef;
}
