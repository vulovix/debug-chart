import { useMemo, useRef, useState, useEffect, useCallback } from "react";
import type { TimelineEvent, Span } from "./types";
import { AXIS_HEIGHT, SPAN_HEIGHT, LANE_HEIGHT, PIXELS_PER_SECOND, TOLERANCE_MS } from "./constants";
import { useTimelineData, useMouseInteraction, useWindowResize } from "./hooks";
import { TimelineAxis, TimelineSpans, TimelineLanes, TimelineScrubber, TooltipPanel } from "./components";
import { GiJumpAcross, GiJumpingRope } from "react-icons/gi";
import "./style.css";

type Props = {
  events: TimelineEvent[];
  height?: number;
  showSpans?: boolean;
};

export default function TimelineDebuggerFeature({ events, showSpans = true }: Props) {
  // Load saved values from localStorage or use defaults
  const getSavedPixelsPerSecond = () => {
    const saved = localStorage.getItem("timeline_pixels_per_second");
    const value = saved ? Number(saved) : PIXELS_PER_SECOND;
    // Validate range: 10-1000 pixels per second
    return Math.max(10, Math.min(1000, value));
  };

  const getSavedTolerance = () => {
    const saved = localStorage.getItem("timeline_tolerance_ms");
    const value = saved ? Number(saved) : TOLERANCE_MS;
    // Validate range: 1-10000 milliseconds
    return Math.max(1, Math.min(10000, value));
  };

  const [toleranceMs, setToleranceMs] = useState(getSavedTolerance);
  const [pixelsPerSecond, setPixelsPerSecond] = useState(getSavedPixelsPerSecond);

  // Save to localStorage when values change
  useEffect(() => {
    localStorage.setItem("timeline_pixels_per_second", pixelsPerSecond.toString());
  }, [pixelsPerSecond]);

  useEffect(() => {
    localStorage.setItem("timeline_tolerance_ms", toleranceMs.toString());
  }, [toleranceMs]);

  const { spans, startTime, totalSeconds, width, tabs } = useTimelineData(events, pixelsPerSecond);
  const { mouseX, isFrozen, frozenX, hoveredEventId, setHoveredEventId, containerRef, onMove, onClick } = useMouseInteraction(pixelsPerSecond);
  const windowHeight = useWindowResize();
  const timelineScrollRef = useRef<HTMLDivElement>(null);

  // Preserve scroll position when zoom changes
  const previousPixelsPerSecondRef = useRef(pixelsPerSecond);
  useEffect(() => {
    const prevZoom = previousPixelsPerSecondRef.current;
    const newZoom = pixelsPerSecond;

    if (prevZoom !== newZoom && timelineScrollRef.current) {
      const scrollLeft = timelineScrollRef.current.scrollLeft;
      const containerWidth = timelineScrollRef.current.clientWidth;
      const centerPixel = scrollLeft + containerWidth / 2;

      // Convert center pixel to time, then back to pixel with new zoom
      const centerTime = startTime + (centerPixel / prevZoom) * 1000;
      const newCenterPixel = ((centerTime - startTime) / 1000) * newZoom;
      const newScrollLeft = Math.max(0, newCenterPixel - containerWidth / 2);

      timelineScrollRef.current.scrollLeft = newScrollLeft;
    }

    previousPixelsPerSecondRef.current = newZoom;
  }, [pixelsPerSecond, startTime]);

  const activeX = isFrozen ? frozenX : mouseX;

  // Helper functions for pixel/time conversions
  const pixelToTime = useCallback((pixel: number) => startTime + Math.round(pixel / pixelsPerSecond) * 1000, [startTime, pixelsPerSecond]);
  const timeToPixel = useCallback((time: number) => ((time - startTime) / 1000) * pixelsPerSecond, [startTime, pixelsPerSecond]);

  // jump to next event
  const jumpToNextEvent = () => {
    if (!timelineScrollRef.current || activeX == null) return;
    const currentTime = pixelToTime(activeX);
    const nextEvent = events.find((ev) => new Date(ev.date).getTime() > currentTime);
    if (nextEvent) {
      const nextX = timeToPixel(new Date(nextEvent.date).getTime());
      timelineScrollRef.current.scrollLeft = Math.max(0, nextX - 200);
    }
  };

  // jump to previous event
  const jumpToPreviousEvent = () => {
    if (!timelineScrollRef.current || activeX == null) return;
    const currentTime = pixelToTime(activeX);
    const previousEvent = [...events].reverse().find((ev) => new Date(ev.date).getTime() < currentTime);
    if (previousEvent) {
      const prevX = timeToPixel(new Date(previousEvent.date).getTime());
      timelineScrollRef.current.scrollLeft = Math.max(0, prevX - 200);
    }
  };

  // jump to first event
  const jumpToFirstEvent = () => {
    if (!timelineScrollRef.current || events.length === 0) return;
    const firstEvent = events.reduce((earliest, current) => (new Date(current.date).getTime() < new Date(earliest.date).getTime() ? current : earliest));
    const firstX = timeToPixel(new Date(firstEvent.date).getTime());
    timelineScrollRef.current.scrollLeft = Math.max(0, firstX - 200);
  };

  // find events near activeX
  const eventsNear = useMemo(() => {
    if (activeX == null) return [];
    const timeAtX = pixelToTime(activeX);
    return events.filter((ev) => Math.abs(new Date(ev.date).getTime() - timeAtX) <= toleranceMs);
  }, [activeX, events, toleranceMs, pixelToTime]);

  // find current span
  const currentSpan = useMemo(() => {
    if (activeX == null) return null;
    const timeAtX = pixelToTime(activeX);
    return (
      spans.find((span: Span) => {
        const from = new Date(span.from).getTime();
        const to = new Date(span.to).getTime();
        return from <= timeAtX && timeAtX < to;
      }) || null
    );
  }, [activeX, spans, pixelToTime]);

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
        <div className="dbg2-actions">
          <div className="dbg2-tolerance-control">
            <input
              id="tolerance-input"
              type="number"
              value={toleranceMs}
              onChange={(e) => {
                const value = e.target.value;
                if (value !== "") {
                  const numValue = Number(value);
                  // Validate range: 1-10000 milliseconds
                  setToleranceMs(Math.max(1, Math.min(10000, numValue)));
                }
              }}
              min="1"
              max="10000"
              step="50"
              title="Event Threshold (ms)"
            />
          </div>
          <div className="dbg2-pixels-control">
            <input
              id="pixels-input"
              type="number"
              value={pixelsPerSecond}
              onChange={(e) => {
                const value = e.target.value;
                if (value !== "") {
                  const numValue = Number(value);
                  // Validate range: 10-1000 pixels per second
                  setPixelsPerSecond(Math.max(10, Math.min(1000, numValue)));
                }
              }}
              min="10"
              max="1000"
              step="10"
              title="Pixels per Second (zoom level)"
            />
          </div>
          <button className="dbg2-first-event-btn" onClick={jumpToFirstEvent} title="Jump to First Event">
            <GiJumpingRope style={{ transform: "scale(1.5)" }} />
          </button>
          <button className="dbg2-prev-event-btn" onClick={jumpToPreviousEvent} title="Jump to Previous Event">
            <GiJumpAcross style={{ transform: "scale(1.5) scaleX(-1)" }} />
          </button>
          <button className="dbg2-next-event-btn" onClick={jumpToNextEvent} title="Jump to Next Event">
            <GiJumpAcross style={{ transform: "scale(1.5)" }} />
          </button>
        </div>
      </div>

      <div className="dbg2-container" ref={containerRef} onMouseMove={onMove} onClick={onClick} style={{ height: `${windowHeight - 340}px` }}>
        {/* Scrollable timeline with tab labels inside */}
        <div
          className="dbg2-timeline-scroll"
          ref={timelineScrollRef}
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
            <TimelineAxis startTime={startTime} totalSeconds={totalSeconds} width={width} pixelsPerSecond={pixelsPerSecond} />
            {showSpans && <TimelineSpans spans={spans} startTime={startTime} pixelsPerSecond={pixelsPerSecond} />}
            <TimelineLanes
              tabs={tabs}
              startTime={startTime}
              width={width}
              dynamicLaneHeight={dynamicLaneHeight}
              showSpans={showSpans}
              hoveredEventId={hoveredEventId}
              setHoveredEventId={setHoveredEventId}
              pixelsPerSecond={pixelsPerSecond}
            />
            <TimelineScrubber activeX={activeX} svgHeight={calculatedSvgHeight} isFrozen={isFrozen} />
          </svg>
        </div>
      </div>

      <TooltipPanel
        activeX={activeX}
        startTime={startTime}
        currentSpan={currentSpan}
        eventsNear={eventsNear}
        isFrozen={isFrozen}
        toleranceMs={toleranceMs}
        pixelsPerSecond={pixelsPerSecond}
      />
    </div>
  );
}
