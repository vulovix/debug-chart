import { formatTimeShort } from "../../utils";
import { AXIS_HEIGHT } from "../../constants";

type TimelineAxisProps = {
  startTime: number;
  totalSeconds: number;
  width: number;
  pixelsPerSecond: number;
};

export function TimelineAxis({ startTime, totalSeconds, width, pixelsPerSecond }: TimelineAxisProps) {
  // compute tick interval for axis
  const tickIntervalSeconds = Math.max(1, Math.ceil(totalSeconds / 8));

  return (
    <g transform={`translate(0,0)`}>
      <rect x={0} y={0} width={width} height={AXIS_HEIGHT} className="dbg2-axis-bg" />
      {Array.from({ length: Math.ceil(totalSeconds / tickIntervalSeconds) + 1 }).map((_, idx) => {
        const secs = idx * tickIntervalSeconds;
        const x = secs * pixelsPerSecond;
        const t = new Date(startTime + secs * 1000);
        return (
          <g key={idx} transform={`translate(${x},0)`}>
            <line x1={0} x2={0} y1={6} y2={AXIS_HEIGHT - 6} className="dbg2-axis-tick" />
            <text x={4} y={18} className="dbg2-time-label">
              {formatTimeShort(t.toISOString())}
            </text>
          </g>
        );
      })}
    </g>
  );
}
