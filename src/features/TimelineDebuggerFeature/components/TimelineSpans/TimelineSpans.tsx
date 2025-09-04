import type { Span } from "../../types";
import { formatTimeShort } from "../../utils";
import { AXIS_HEIGHT, PIXELS_PER_SECOND, SPAN_HEIGHT } from "../../constants";

type TimelineSpansProps = {
  spans: Span[];
  startTime: number;
};

export function TimelineSpans({ spans, startTime }: TimelineSpansProps) {
  return (
    <g transform={`translate(0,${AXIS_HEIGHT})`}>
      {spans.map((span, i) => {
        const fromTime = new Date(span.from).getTime();
        const toTime = new Date(span.to).getTime();
        const x1 = ((fromTime - startTime) / 1000) * PIXELS_PER_SECOND;
        const x2 = ((toTime - startTime) / 1000) * PIXELS_PER_SECOND;
        const w = x2 - x1 + 5;
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
