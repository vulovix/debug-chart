import { useMemo } from "react";
import type { TimelineEvent, Span } from "./types";
import { AXIS_HEIGHT, SPAN_HEIGHT, LANE_HEIGHT, TOLERANCE_MS } from "./constants";
import { useTimelineData, useMouseInteraction, useWindowResize } from "./hooks";
import { TimelineAxis, TimelineSpans, TimelineLanes, TimelineScrubber, TooltipPanel } from "./components";
import "./style.css";

type Props = {
  events: TimelineEvent[];
  height?: number;
  showSpans?: boolean;
};

export default function TimelineDebuggerFeature({ events, showSpans = true }: Props) {
  const { spans, startTime, totalSeconds, width, tabs } = useTimelineData(events);
  const { mouseX, isFrozen, frozenX, hoveredEventId, setHoveredEventId, containerRef, onMove, onClick } = useMouseInteraction();
  const windowHeight = useWindowResize();

  const activeX = isFrozen ? frozenX : mouseX;

  // find events near activeX
  const eventsNear = useMemo(() => {
    if (activeX == null) return [];
    const timeAtX = startTime + Math.round(activeX / 40) * 1000;
    return events.filter((ev) => Math.abs(new Date(ev.date).getTime() - timeAtX) <= TOLERANCE_MS);
  }, [activeX, events, startTime]);

  // find current span
  const currentSpan = useMemo(() => {
    if (activeX == null) return null;
    const timeAtX = startTime + Math.round(activeX / 40) * 1000;
    return (
      spans.find((span: Span) => {
        const from = new Date(span.from).getTime();
        const to = new Date(span.to).getTime();
        return from <= timeAtX && timeAtX < to;
      }) || null
    );
  }, [activeX, spans, startTime]);

  // Error handling: validate props
  if (!Array.isArray(events)) {
    return <div className="dbg2-error">Error: events must be an array</div>;
  }

  const availableHeight = windowHeight - 340; // minus taller tooltip (300px) and title space (40px)
  const laneAreaHeight = availableHeight - AXIS_HEIGHT - (showSpans ? SPAN_HEIGHT : 0);
  const dynamicLaneHeight = Math.max(LANE_HEIGHT, laneAreaHeight / tabs.length);
  const calculatedSvgHeight = AXIS_HEIGHT + (showSpans ? SPAN_HEIGHT : 0) + tabs.length * dynamicLaneHeight;
  const maxTimelineHeight = windowHeight - 400; // Allow space for scrolling
  const svgHeight = Math.min(calculatedSvgHeight, maxTimelineHeight);
  const isScrollable = calculatedSvgHeight > maxTimelineHeight;

  return (
    <div className="dbg2-root">
      <div className="dbg2-toolbar">
        <div className="dbg2-title">Debugger Two — Interactive Timeline</div>
      </div>

      <div className="dbg2-container" ref={containerRef} onMouseMove={onMove} onClick={onClick} style={{ height: `${windowHeight - 340}px` }}>
        {/* Scrollable timeline with tab labels inside */}
        <div
          className="dbg2-timeline-scroll"
          style={{ width: `${width}px`, height: `${svgHeight + 46}px`, overflowY: isScrollable ? "auto" : "visible", position: "relative" }}
        >
          {/* Tab labels positioned absolutely inside the scrollable area */}
          <div className="dbg2-tab-labels" style={{ position: "absolute", left: 0, top: 0, height: `${calculatedSvgHeight}px`, zIndex: 1 }}>
            {tabs.map((tab, i) => {
              const yOffset = AXIS_HEIGHT + (showSpans ? SPAN_HEIGHT : 0) + i * dynamicLaneHeight;
              return (
                <div key={tab.tabId} className="dbg2-tab-label" style={{ position: "absolute", top: `${yOffset}px` }}>
                  Tab {tab.tabId}
                </div>
              );
            })}
          </div>

          {/* SVG timeline */}
          <svg className="dbg2-svg" width={width} height={calculatedSvgHeight} style={{ marginLeft: "50px" }}>
            <TimelineAxis startTime={startTime} totalSeconds={totalSeconds} width={width} />
            {showSpans && <TimelineSpans spans={spans} startTime={startTime} />}
            <TimelineLanes
              tabs={tabs}
              startTime={startTime}
              width={width}
              dynamicLaneHeight={dynamicLaneHeight}
              showSpans={showSpans}
              hoveredEventId={hoveredEventId}
              setHoveredEventId={setHoveredEventId}
            />
            <TimelineScrubber activeX={activeX} svgHeight={calculatedSvgHeight} isFrozen={isFrozen} />
          </svg>
        </div>
      </div>

      <TooltipPanel activeX={activeX} startTime={startTime} currentSpan={currentSpan} eventsNear={eventsNear} isFrozen={isFrozen} />
    </div>
  );
}
