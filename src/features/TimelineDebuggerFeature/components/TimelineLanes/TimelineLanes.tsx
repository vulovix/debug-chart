import type { TabNode, TimelineEvent } from "../../types";
import { getDotColor, lightenColor } from "../../utils";
import { AXIS_HEIGHT, PIXELS_PER_SECOND, SPAN_HEIGHT } from "../../constants";

type TimelineLanesProps = {
  tabs: TabNode[];
  startTime: number;
  width: number;
  dynamicLaneHeight: number;
  showSpans: boolean;
  hoveredEventId: number | null;
  setHoveredEventId: (id: number | null) => void;
};

export function TimelineLanes({ tabs, startTime, width, dynamicLaneHeight, showSpans, hoveredEventId, setHoveredEventId }: TimelineLanesProps) {
  return (
    <>
      {tabs.map((tab, i) => {
        const yOffset = AXIS_HEIGHT + (showSpans ? SPAN_HEIGHT : 0) + i * dynamicLaneHeight;
        return (
          <g key={tab.tabId} transform={`translate(0, ${yOffset})`}>
            <rect x={0} y={0} width={width} height={dynamicLaneHeight - 4} className="dbg2-lane" />

            {/* events for this tab */}
            {tab.events.map((ev: TimelineEvent) => {
              const t = new Date(ev.date).getTime();
              const x = ((t - startTime) / 1000) * PIXELS_PER_SECOND;
              let cy = dynamicLaneHeight / 2;
              if (ev.scope === "page") {
                cy = dynamicLaneHeight / 4;
              } else if (ev.scope === "left") {
                cy = dynamicLaneHeight / 2;
              } else if (ev.scope === "widget") {
                cy = (3 * dynamicLaneHeight) / 4;
              }
              const color = getDotColor(ev.scope);
              const isHovered = hoveredEventId === ev.id;
              const hoverColor = isHovered ? lightenColor(color, 0.3) : color;
              return (
                <circle
                  key={ev.id}
                  cx={x}
                  cy={cy}
                  r={4}
                  fill={hoverColor}
                  className="dbg2-dot"
                  onMouseEnter={() => setHoveredEventId(ev.id)}
                  onMouseLeave={() => setHoveredEventId(null)}
                  style={{
                    filter: isHovered ? "drop-shadow(0 0 4px rgba(255, 255, 255, 0.5))" : "none",
                    cursor: "pointer",
                  }}
                />
              );
            })}
          </g>
        );
      })}
    </>
  );
}
