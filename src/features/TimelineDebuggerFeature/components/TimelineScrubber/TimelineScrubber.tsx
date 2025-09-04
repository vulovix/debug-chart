type TimelineScrubberProps = {
  activeX: number | null;
  svgHeight: number;
  isFrozen: boolean;
};

export function TimelineScrubber({ activeX, svgHeight, isFrozen }: TimelineScrubberProps) {
  if (activeX == null) return null;
  return <line x1={activeX} x2={activeX} y1={0} y2={svgHeight} className={`dbg2-scrubber ${isFrozen ? "frozen" : ""}`} />;
}
