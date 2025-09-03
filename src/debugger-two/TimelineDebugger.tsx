import React, { useMemo, useRef, useState, useCallback, useEffect } from "react";
import type { TimelineEvent } from "./types";
import { buildSpans, buildHierarchy } from "./utils";
import "./TimelineDebugger.css";

type Props = {
  events: TimelineEvent[];
  height?: number;
  showSpans?: boolean;
};

const PIXELS_PER_SECOND = 40; // zoom level
const LANE_HEIGHT = 60;
const AXIS_HEIGHT = 30;
const SPAN_HEIGHT = 20;

function formatTimeIso(iso: string) {
  const d = new Date(iso);
  return d.toISOString().replace("T", " ").replace("Z", "");
}

function formatTimeShort(iso: string) {
  const d = new Date(iso);
  return d.toISOString().substr(11, 8);
}

function getDotColor(scope: string | null | undefined): string {
  switch (scope) {
    case "page":
      return "#4da6ff"; // bright blue
    case "left":
      return "#ffa64d"; // bright orange
    case "widget":
      return "#66ff66"; // bright green
    default:
      return "#e6e6e6"; // light gray for root/other
  }
}

function lightenColor(color: string, factor: number): string {
  // Simple color lightening by increasing RGB values
  const hex = color.replace("#", "");
  const r = Math.min(255, Math.floor(parseInt(hex.substr(0, 2), 16) * (1 + factor)));
  const g = Math.min(255, Math.floor(parseInt(hex.substr(2, 2), 16) * (1 + factor)));
  const b = Math.min(255, Math.floor(parseInt(hex.substr(4, 2), 16) * (1 + factor)));
  return `rgb(${r}, ${g}, ${b})`;
}

export default function TimelineDebugger({ events, showSpans = true }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [mouseX, setMouseX] = useState<number | null>(null);
  const [isFrozen, setIsFrozen] = useState(false);
  const [frozenX, setFrozenX] = useState<number | null>(null);
  const [hoveredEventId, setHoveredEventId] = useState<number | null>(null);
  const [windowHeight, setWindowHeight] = useState(window.innerHeight);

  const spans = useMemo(() => buildSpans(events), [events]);
  const hierarchy = useMemo(() => buildHierarchy(events), [events]);

  // compute bounds
  const startTime = useMemo(() => {
    if (events.length === 0) return Date.now();
    return Math.min(...events.map((e) => new Date(e.date).getTime()));
  }, [events]);
  const endTime = useMemo(() => {
    if (events.length === 0) return Date.now();
    return Math.max(...events.map((e) => new Date(e.date).getTime()));
  }, [events]);

  const totalSeconds = Math.max(1, Math.ceil((endTime - startTime) / 1000));
  const width = totalSeconds * PIXELS_PER_SECOND;

  const tabs = useMemo(() => Object.values(hierarchy).sort((a, b) => a.tabId - b.tabId), [hierarchy]);

  const onMove = useCallback(
    (e: React.MouseEvent) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const scrollLeft = containerRef.current?.querySelector(".dbg2-timeline-scroll")?.scrollLeft || 0;
      const x = e.clientX - rect.left - 50 + scrollLeft; // Subtract tab labels width
      // const x = e.clientX - rect.left - 0 + scrollLeft; // Subtract tab labels width
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

  useEffect(() => {
    const handleResize = () => setWindowHeight(window.innerHeight);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const activeX = isFrozen ? frozenX : mouseX;

  // find events near activeX
  const toleranceMs = 500;
  const eventsNear = useMemo(() => {
    if (activeX == null) return [];
    const timeAtX = startTime + Math.round(activeX / PIXELS_PER_SECOND) * 1000;
    return events.filter((ev) => Math.abs(new Date(ev.date).getTime() - timeAtX) <= toleranceMs);
  }, [activeX, events, startTime]);

  // find current span
  const currentSpan = useMemo(() => {
    if (activeX == null) return null;
    const timeAtX = startTime + Math.round(activeX / PIXELS_PER_SECOND) * 1000;
    return (
      spans.find((span) => {
        const from = new Date(span.from).getTime();
        const to = new Date(span.to).getTime();
        return from <= timeAtX && timeAtX < to;
      }) || null
    );
  }, [activeX, spans, startTime]);

  // compute tick interval for axis
  const tickIntervalSeconds = Math.max(1, Math.ceil(totalSeconds / 8));

  const availableHeight = windowHeight - 340; // minus taller tooltip (300px) and title space (40px)
  const laneAreaHeight = availableHeight - AXIS_HEIGHT - (showSpans ? SPAN_HEIGHT : 0);
  const dynamicLaneHeight = Math.max(LANE_HEIGHT, laneAreaHeight / tabs.length);
  const svgHeight = AXIS_HEIGHT + (showSpans ? SPAN_HEIGHT : 0) + tabs.length * dynamicLaneHeight;

  return (
    <div className="dbg2-root">
      <div className="dbg2-toolbar">
        <div className="dbg2-title">Debugger Two — Interactive Timeline</div>
      </div>

      <div className="dbg2-container" ref={containerRef} onMouseMove={onMove} onClick={onClick} style={{ height: `${windowHeight - 340}px` }}>
        {/* Sticky tab labels */}
        <div className="dbg2-tab-labels">
          {tabs.map((tab, i) => {
            const yOffset = AXIS_HEIGHT + (showSpans ? SPAN_HEIGHT : 0) + i * dynamicLaneHeight;
            return (
              <div key={tab.tabId} className="dbg2-tab-label" style={{ top: `${yOffset + 0}px` }}>
                Tab {tab.tabId}
              </div>
            );
          })}
        </div>

        {/* Scrollable timeline */}
        <div className="dbg2-timeline-scroll" style={{ width: `${width}px` }}>
          <svg className="dbg2-svg" width={width} height={svgHeight}>
            {/* time axis */}
            <g transform={`translate(0,0)`}>
              <rect x={0} y={0} width={width} height={AXIS_HEIGHT} className="dbg2-axis-bg" />
              {Array.from({ length: Math.ceil(totalSeconds / tickIntervalSeconds) + 1 }).map((_, idx) => {
                const secs = idx * tickIntervalSeconds;
                const x = secs * PIXELS_PER_SECOND;
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

            {/* spans if enabled */}
            {showSpans && (
              <g transform={`translate(0,${AXIS_HEIGHT})`}>
                {spans.map((span, i) => {
                  const fromTime = new Date(span.from).getTime();
                  const toTime = new Date(span.to).getTime();
                  const x1 = ((fromTime - startTime) / 1000) * PIXELS_PER_SECOND;
                  const x2 = ((toTime - startTime) / 1000) * PIXELS_PER_SECOND;
                  const w = x2 - x1 + 5;
                  return (
                    <g key={i}>
                      {/* add border to the right */}
                      <rect
                        x={x1}
                        y={0}
                        width={w}
                        height={SPAN_HEIGHT}
                        className="dbg2-span-bg"
                        // style={{ stroke: "#666", strokeWidth: 1 }}
                        // strokeDasharray={`0 ${w} ${SPAN_HEIGHT} 0`}
                      />
                      <text x={x1 + 4} y={12} className="dbg2-span-label">
                        {formatTimeShort(span.from)} - {formatTimeShort(span.to)}
                      </text>
                    </g>
                  );
                })}
              </g>
            )}

            {/* lanes */}
            {tabs.map((tab, i) => {
              const yOffset = AXIS_HEIGHT + (showSpans ? SPAN_HEIGHT : 0) + i * dynamicLaneHeight;
              return (
                <g key={tab.tabId} transform={`translate(0, ${yOffset})`}>
                  <rect x={0} y={0} width={width} height={dynamicLaneHeight - 4} className="dbg2-lane" />

                  {/* events for this tab */}
                  {tab.events.map((ev) => {
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

            {/* scrubber line */}
            {activeX != null && <line x1={activeX} x2={activeX} y1={0} y2={svgHeight} className={`dbg2-scrubber ${isFrozen ? "frozen" : ""}`} />}
          </svg>
        </div>
      </div>

      <div className="dbg2-tooltip-panel">
        {activeX == null ? (
          <div className="dbg2-tooltip-empty">Hover timeline to inspect events</div>
        ) : (
          <div className="dbg2-tooltip">
            <div className="dbg2-tooltip-time">
              {activeX != null ? formatTimeIso(new Date(startTime + Math.round(activeX / PIXELS_PER_SECOND) * 1000).toISOString()) : "—"}
            </div>
            {currentSpan && (
              <div className="dbg2-tooltip-span">
                Span: {formatTimeShort(currentSpan.from)} - {formatTimeShort(currentSpan.to)}
              </div>
            )}
            <div className="dbg2-tooltip-list">
              {eventsNear.length === 0 ? (
                <div className="dbg2-tooltip-none">No events within ±500ms</div>
              ) : (
                eventsNear.map((ev) => {
                  const color = getDotColor(ev.scope);
                  return (
                    <div key={ev.id} className="dbg2-tooltip-item">
                      <div className="dbg2-tooltip-item-main">
                        <span className="dbg2-tooltip-scope-dot" style={{ backgroundColor: color }}></span>
                        Tab {ev.tabId} → {ev.scope ?? "Page"}
                        {ev.parentId ? ` → Widget ${ev.parentId}` : ""} → {ev.action ?? ev.property ?? "event"}
                      </div>
                      <div className="dbg2-tooltip-item-meta">{formatTimeIso(ev.date)}</div>
                    </div>
                  );
                })
              )}
            </div>
            {isFrozen ? <div className="dbg2-hint">Frozen — click to unfreeze</div> : <div className="dbg2-hint">Click to freeze</div>}
          </div>
        )}
      </div>
    </div>
  );
}
