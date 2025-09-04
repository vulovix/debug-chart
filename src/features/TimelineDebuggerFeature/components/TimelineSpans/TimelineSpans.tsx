import type { Span } from "../../types";
import { formatTimeShort } from "../../utils";
import { AXIS_HEIGHT, SPAN_HEIGHT } from "../../constants";

type TimelineSpansProps = {
  spans: Span[];
  startTime: number;
  pixelsPerSecond: number;
};

export function TimelineSpans({ spans, startTime, pixelsPerSecond }: TimelineSpansProps) {
  return (
    <g transform={`translate(0,${AXIS_HEIGHT})`}>
      {spans.map((span, i) => {
        const fromTime = new Date(span.from).getTime();
        const toTime = new Date(span.to).getTime();
        const x1 = ((fromTime - startTime) / 1000) * pixelsPerSecond;
        const x2 = ((toTime - startTime) / 1000) * pixelsPerSecond;
        // const w = Math.max(0, x2 - x1);
        const gap = pixelsPerSecond * 0.01; // 1% of pixels per second
        const w = Math.max(0, x2 - x1 - gap);
        return (
          <g key={i}>
            <rect x={x1} y={0} width={w} height={SPAN_HEIGHT} className="dbg2-span-bg" />
            <text x={x1 + 4} y={12} className="dbg2-span-label">
              {formatTimeShort(span.from)} - {formatTimeShort(span.to)}
            </text>
          </g>
        );
      })}
    </g>
  );
}
