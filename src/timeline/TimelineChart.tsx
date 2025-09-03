import React, { useState, useMemo, useCallback, useRef, useEffect } from "react";
import type { TimelineEvent } from "./data";
import { groupEventsByTab, calculateTimeRange, getTimePosition, getTimestampFromPosition, formatTime, formatPreciseTime, createTimeWindows } from "./utils";
import TimelineTooltip from "./TimelineTooltip";
import "./TimelineChart.css";

interface TimelineChartProps {
  events: TimelineEvent[];
  height?: number;
}

interface EventDotProps {
  event: TimelineEvent;
  xPosition: number;
  yOffset: number;
}

const EventDot: React.FC<EventDotProps> = React.memo(({ event, xPosition, yOffset }) => {
  return (
    <div
      className={`event-dot event-${event.scope || "action"}`}
      style={{
        left: `${xPosition}%`,
        top: `${yOffset}px`,
      }}
      title={`${event.action || event.property} at ${formatPreciseTime(new Date(event.date))} (User ${event.userId})`}
    />
  );
});

EventDot.displayName = "EventDot";

const TimelineChart: React.FC<TimelineChartProps> = ({ events, height = 400 }) => {
  const [cursorTime, setCursorTime] = useState<Date | null>(null);
  const [isFrozen, setIsFrozen] = useState(false);
  const [frozenTime, setFrozenTime] = useState<Date | null>(null);
  const chartRef = useRef<HTMLDivElement>(null);

  // Memoized calculations for performance
  const groupedEvents = useMemo(() => groupEventsByTab(events), [events]);
  const timeRange = useMemo(() => calculateTimeRange(events), [events]);
  const timeWindows = useMemo(() => createTimeWindows(timeRange), [timeRange]);

  // Calculate lane height based on number of tabs
  const tabIds = Object.keys(groupedEvents)
    .map((id) => parseInt(id))
    .sort((a, b) => a - b);
  const laneHeight = height / tabIds.length;

  // Handle mouse interactions
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!chartRef.current || isFrozen) return;

      const rect = chartRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const xPercent = (x / rect.width) * 100;
      const timeAtPosition = getTimestampFromPosition(xPercent, timeRange);

      setCursorTime(timeAtPosition);
    },
    [timeRange, isFrozen]
  );

  const handleMouseLeave = useCallback(() => {
    if (!isFrozen) {
      setCursorTime(null);
    }
  }, [isFrozen]);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (!chartRef.current) return;

      const rect = chartRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const xPercent = (x / rect.width) * 100;
      const clickedTime = getTimestampFromPosition(xPercent, timeRange);

      if (isFrozen) {
        // Unfreeze
        setIsFrozen(false);
        setFrozenTime(null);
        setCursorTime(null);
      } else {
        // Freeze at clicked position
        setIsFrozen(true);
        setFrozenTime(clickedTime);
        setCursorTime(clickedTime);
      }
    },
    [timeRange, isFrozen]
  );

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isFrozen) {
        setIsFrozen(false);
        setFrozenTime(null);
        setCursorTime(null);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isFrozen]);

  // Handle clicks outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (chartRef.current && !chartRef.current.contains(e.target as Node) && isFrozen) {
        setIsFrozen(false);
        setFrozenTime(null);
        setCursorTime(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isFrozen]);

  const handleTooltipClose = useCallback(() => {
    setIsFrozen(false);
    setFrozenTime(null);
    setCursorTime(null);
  }, []);

  return (
    <div className="timeline-chart-container">
      <div className="timeline-header">
        <h3>📊 Interactive Timeline Debugger</h3>
        <div className="timeline-stats">
          <span className="stat-item">{events.length} events</span>
          <span className="stat-item">{tabIds.length} tabs</span>
          <span className="stat-item">{timeWindows.length} time windows</span>
          <span className="stat-item">±1s tolerance</span>
        </div>
        {isFrozen && frozenTime && (
          <div className="frozen-indicator">
            <span className="frozen-icon">📌</span>
            <span className="frozen-text">Frozen at {formatPreciseTime(frozenTime)}</span>
            <span className="frozen-hint">(ESC or click outside to unfreeze)</span>
          </div>
        )}
      </div>

      <div
        ref={chartRef}
        className="timeline-chart"
        style={{ height: `${height}px` }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
      >
        {/* Time windows background */}
        <div className="time-windows">
          {timeWindows.map((window, index) => {
            const startX = getTimePosition(window.start, timeRange);
            const endX = getTimePosition(window.end, timeRange);
            const width = endX - startX;
            return (
              <div
                key={index}
                className="time-window-bg"
                style={{
                  left: `${startX}%`,
                  width: `${width}%`,
                }}
                title={`5s window: ${window.label}`}
              />
            );
          })}
        </div>

        {/* Tab lanes */}
        {tabIds.map((tabId, laneIndex) => {
          const tabEvents = groupedEvents[tabId];
          const laneTop = laneIndex * laneHeight;

          return (
            <div
              key={tabId}
              className="tab-lane"
              style={{
                top: `${laneTop}px`,
                height: `${laneHeight}px`,
              }}
            >
              <div className="lane-label">
                <span className="tab-icon">📑</span>
                <span className="tab-name">Tab {tabId}</span>
                <span className="event-count">({tabEvents.length})</span>
              </div>

              <div className="lane-events">
                {tabEvents.map((event) => {
                  const eventTime = new Date(event.date);
                  const xPosition = getTimePosition(eventTime, timeRange);

                  // Deterministic stacking to avoid overlap - use event ID for consistent positioning
                  const stackOffset = (event.id * 7) % 20; // Consistent offset based on event ID

                  return <EventDot key={event.id} event={event} xPosition={xPosition} yOffset={stackOffset} />;
                })}
              </div>
            </div>
          );
        })}

        {/* Cursor line */}
        {(cursorTime || (isFrozen && frozenTime)) && (
          <div
            className={`timeline-cursor ${isFrozen ? "frozen" : ""}`}
            style={{
              left: `${getTimePosition(isFrozen && frozenTime ? frozenTime : cursorTime!, timeRange)}%`,
            }}
          >
            <div className="cursor-line" />
            <div className="cursor-handle">{isFrozen ? "📌" : "⋮"}</div>
          </div>
        )}

        {/* Time axis */}
        <div className="time-axis">
          {Array.from({ length: 11 }, (_, i) => {
            const timePercent = i * 10;
            const timeAtPosition = getTimestampFromPosition(timePercent, timeRange);
            return (
              <div key={i} className="time-tick" style={{ left: `${timePercent}%` }}>
                <span className="time-label">{formatTime(timeAtPosition)}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tooltip */}
      {((cursorTime && !isFrozen) || (isFrozen && frozenTime)) && (
        <TimelineTooltip
          cursorTime={isFrozen && frozenTime ? frozenTime : cursorTime!}
          groupedEvents={groupedEvents}
          isSticky={isFrozen}
          onClose={handleTooltipClose}
        />
      )}

      {/* Current time info */}
      {cursorTime && !isFrozen && (
        <div className="cursor-info">
          <span className="cursor-time">{formatTime(cursorTime)}</span>
          <span className="cursor-window">
            Window: {Math.floor(cursorTime.getTime() / 5000) * 5}s - {Math.floor(cursorTime.getTime() / 5000) * 5 + 5}s
          </span>
        </div>
      )}
    </div>
  );
};

export default TimelineChart;
