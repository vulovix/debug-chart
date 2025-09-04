import { useState, useCallback, useRef } from "react";

export function useMouseInteraction(pixelsPerSecond: number) {
  const [mouseX, setMouseX] = useState<number | null>(null);
  const [isFrozen, setIsFrozen] = useState(false);
  const [hoveredEventId, setHoveredEventId] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Store time positions instead of pixel positions for frozen state
  const [frozenTimePosition, setFrozenTimePosition] = useState<number | null>(null);

  // Convert frozen time position to pixel position when pixelsPerSecond changes
  const frozenPixelPosition = frozenTimePosition !== null ? frozenTimePosition * pixelsPerSecond : null;

  const onMove = useCallback(
    (e: React.MouseEvent) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const scrollLeft = containerRef.current?.querySelector(".dbg2-timeline-scroll")?.scrollLeft || 0;
      const x = e.clientX - rect.left - 50 + scrollLeft; // Subtract tab labels width
      setMouseX(x);
      if (isFrozen) return;
    },
    [isFrozen]
  );

  const onClick = useCallback(() => {
    if (mouseX == null) return;
    if (isFrozen) {
      setIsFrozen(false);
      setFrozenTimePosition(null);
    } else {
      setIsFrozen(true);
      // Store the time position instead of pixel position
      const timePosition = mouseX / pixelsPerSecond;
      setFrozenTimePosition(timePosition);
    }
  }, [mouseX, isFrozen, pixelsPerSecond]);

  return {
    mouseX,
    isFrozen,
    frozenX: frozenPixelPosition,
    hoveredEventId,
    setHoveredEventId,
    containerRef,
    onMove,
    onClick,
  };
}
