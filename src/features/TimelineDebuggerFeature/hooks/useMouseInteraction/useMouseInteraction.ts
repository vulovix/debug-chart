import { useState, useCallback, useRef } from "react";

export function useMouseInteraction() {
  const [mouseX, setMouseX] = useState<number | null>(null);
  const [isFrozen, setIsFrozen] = useState(false);
  const [frozenX, setFrozenX] = useState<number | null>(null);
  const [hoveredEventId, setHoveredEventId] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

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
      setFrozenX(null);
    } else {
      setIsFrozen(true);
      setFrozenX(mouseX);
    }
  }, [mouseX, isFrozen]);

  return {
    mouseX,
    isFrozen,
    frozenX,
    hoveredEventId,
    setHoveredEventId,
    containerRef,
    onMove,
    onClick,
  };
}
