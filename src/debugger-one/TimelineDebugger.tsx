import React, { useMemo, useRef, useState, useCallback } from "react";
import type { TimelineEvent } from "./types";
import { buildSpans, buildHierarchy } from "./utils";
import "./TimelineDebugger.css";

type Props = {
  events: TimelineEvent[];
  height?: number;
};

const PIXELS_PER_SECOND = 40; // zoom level (reduced so timeline is visible)
const LANE_HEIGHT = 56;
const AXIS_HEIGHT = 28;

function formatTimeIso(iso: string) {
  const d = new Date(iso);
  return d.toISOString().replace("T", " ").replace("Z", "");
}

export default function TimelineDebugger({ events, height = 400 }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [mouseX, setMouseX] = useState<number | null>(null);
  const [frozenAt, setFrozenAt] = useState<number | null>(null);

  const spans = useMemo(() => buildSpans(events), [events]);
  // reference spans to avoid unused variable lint
  void spans;
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
      const x = e.clientX - rect.left;
      setMouseX(x);
      if (frozenAt != null) return;
    },
    [frozenAt]
  );

  const onClick = useCallback(() => {
    if (mouseX == null) return;
    setFrozenAt(mouseX);
  }, [mouseX]);

  const onUnfreeze = () => setFrozenAt(null);

  const activeX = frozenAt ?? mouseX;

  // find events near activeX
  const toleranceMs = 50;
  const eventsNear = useMemo(() => {
    if (activeX == null) return [];
    const timeAtX = startTime + Math.round(activeX / PIXELS_PER_SECOND) * 1000;
    return events.filter((ev) => Math.abs(new Date(ev.date).getTime() - timeAtX) <= toleranceMs);
  }, [activeX, events, startTime]);

  // compute tick interval for axis (approx 8 labels)
  const tickIntervalSeconds = Math.max(1, Math.ceil(totalSeconds / 8));

  return (
    <div className="dbg-root">
      <div className="dbg-toolbar">
        <div className="dbg-title">Debugger One — Timeline</div>
        <div className="dbg-actions">
          <button
            onClick={() => {
              /* placeholder for zoom */
            }}
          >
            Zoom
          </button>
          <button onClick={onUnfreeze} disabled={frozenAt == null}>
            Unfreeze
          </button>
        </div>
      </div>

      <div className="dbg-container" ref={containerRef} onMouseMove={onMove} onClick={onClick} style={{ height }}>
        <div className="dbg-svg-wrap" style={{ width }}>
          <svg className="dbg-svg" width={width} height={AXIS_HEIGHT + tabs.length * LANE_HEIGHT}>
            {/* time axis */}
            <g transform={`translate(0,0)`}>
              <rect x={0} y={0} width={width} height={AXIS_HEIGHT} className="dbg-axis-bg" />
              {Array.from({ length: Math.ceil(totalSeconds / tickIntervalSeconds) + 1 }).map((_, idx) => {
                const secs = idx * tickIntervalSeconds;
                const x = secs * PIXELS_PER_SECOND;
                const t = new Date(startTime + secs * 1000);
                return (
                  <g key={idx} transform={`translate(${x},0)`}>
                    <line x1={0} x2={0} y1={6} y2={AXIS_HEIGHT - 6} className="dbg-axis-tick" />
                    <text x={4} y={12} className="dbg-time-label">
                      {t.toISOString().substr(11, 8)}
                    </text>
                  </g>
                );
              })}
            </g>

            {/* lanes (shifted down by axis height) */}
            {tabs.map((tab, i) => (
              <g key={tab.tabId} transform={`translate(0, ${AXIS_HEIGHT + i * LANE_HEIGHT})`}>
                <rect x={0} y={0} width={width} height={LANE_HEIGHT - 4} className="dbg-lane" />
                <text x={8} y={18} className="dbg-lane-label">{`Tab ${tab.tabId}`}</text>

                {/* events for this tab */}
                {tab.events.map((ev) => {
                  const t = new Date(ev.date).getTime();
                  const x = ((t - startTime) / 1000) * PIXELS_PER_SECOND;
                  return <circle key={ev.id} cx={x} cy={LANE_HEIGHT / 2} r={6} className="dbg-dot" />;
                })}
              </g>
            ))}

            {/* scrubber line */}
            {activeX != null && (
              <line
                x1={activeX}
                x2={activeX}
                y1={0}
                y2={AXIS_HEIGHT + tabs.length * LANE_HEIGHT}
                className={`dbg-scrubber ${frozenAt != null ? "frozen" : ""}`}
              />
            )}
          </svg>
        </div>
      </div>

      <div className="dbg-tooltip-panel">
        {activeX == null ? (
          <div className="dbg-tooltip-empty">Hover timeline to inspect events</div>
        ) : (
          <div className="dbg-tooltip">
            <div className="dbg-tooltip-time">{eventsNear.length > 0 ? formatTimeIso(eventsNear[0].date) : "—"}</div>
            <div className="dbg-tooltip-list">
              {eventsNear.length === 0 ? (
                <div className="dbg-tooltip-none">No events within ±50ms</div>
              ) : (
                eventsNear.map((ev) => (
                  <div key={ev.id} className="dbg-tooltip-item">
                    <div className="dbg-tooltip-item-main">
                      Tab {ev.tabId} → {ev.scope ?? "Page"}
                      {ev.parentId ? ` → Widget ${ev.parentId}` : ""} → {ev.action ?? ev.property ?? "event"}
                    </div>
                    <div className="dbg-tooltip-item-meta">{new Date(ev.date).toISOString()}</div>
                  </div>
                ))
              )}
            </div>
            {frozenAt == null ? <div className="dbg-hint">Click to freeze</div> : <div className="dbg-hint">Frozen — click Unfreeze</div>}
          </div>
        )}
      </div>
    </div>
  );
}
