import React, { useState, useRef, useMemo, useCallback, useEffect } from "react";
import type { BaseItem } from "../types/TreeItem";
import "./TimelineChart.css";

interface TimelineChartProps {
  data: BaseItem[];
}

interface ChartEvent {
  id: number;
  tabId: number;
  timestamp: Date;
  type: "page" | "left" | "widget" | "action";
  label: string;
  userId: number;
  parentId: number | null;
  scope: string | null;
  property: string;
  stackLevel: number;
}

interface TabLane {
  tabId: number;
  tabLabel: string;
  events: ChartEvent[];
  maxStackHeight: number;
}

const TimelineChart: React.FC<TimelineChartProps> = ({ data }) => {
  const [cursorTime, setCursorTime] = useState<Date | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [hoveredEvents, setHoveredEvents] = useState<ChartEvent[]>([]);
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | null>(null);
  const [isStickyMode, setIsStickyMode] = useState(false);
  const [stickyTime, setStickyTime] = useState<Date | null>(null);
  const [stickyEvents, setStickyEvents] = useState<ChartEvent[]>([]);
  const chartRef = useRef<HTMLDivElement>(null);

  // Process data into chart format
  const { tabLanes, timeRange, timeWindows } = useMemo(() => {
    const events: ChartEvent[] = data.map((item) => {
      let timestamp: Date;
      if (item.date === "Date") {
        timestamp = new Date(Date.now());
      } else if (typeof item.date === "string") {
        timestamp = new Date(item.date);
      } else if (typeof item.date === "number") {
        timestamp = new Date(item.date);
      } else {
        // Assume it's already a Date object or try to convert it
        timestamp = new Date(item.date as string | number | Date);
      }

      // Ensure timestamp is valid
      if (isNaN(timestamp.getTime())) {
        timestamp = new Date(Date.now()); // Fallback to current time
      }

      return {
        id: item.id,
        tabId: item.tabId,
        timestamp,
        type: item.scope || "action",
        label: item.property,
        userId: item.userId,
        parentId: item.parentId,
        scope: item.scope,
        property: item.property,
        stackLevel: 0, // Will be calculated later
      };
    });

    // Sort events by timestamp
    events.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    // Group by tab
    const tabGroups = new Map<number, ChartEvent[]>();
    for (const event of events) {
      if (!tabGroups.has(event.tabId)) {
        tabGroups.set(event.tabId, []);
      }
      tabGroups.get(event.tabId)!.push(event);
    }

    // Create tab lanes with stacking
    const lanes: TabLane[] = [];
    for (const [tabId, tabEvents] of tabGroups) {
      // Sort events within tab by timestamp
      tabEvents.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

      // Calculate stacking positions to avoid overlap
      const stackedEvents = tabEvents.map((event) => ({ ...event, stackLevel: 0 }));

      for (let i = 0; i < stackedEvents.length; i++) {
        const event = stackedEvents[i];
        let stackLevel = 0;

        // Check for overlaps with previous events
        for (let j = 0; j < i; j++) {
          const prevEvent = stackedEvents[j];
          const timeDiff = Math.abs(event.timestamp.getTime() - prevEvent.timestamp.getTime());
          if (timeDiff < 2000) {
            // 2 second overlap threshold
            stackLevel = Math.max(stackLevel, prevEvent.stackLevel + 1);
          }
        }

        event.stackLevel = stackLevel;
      }

      const maxStackHeight = Math.max(0, ...stackedEvents.map((e) => e.stackLevel)) + 1;

      lanes.push({
        tabId,
        tabLabel: `Tab ${tabId}`,
        events: stackedEvents,
        maxStackHeight,
      });
    }

    // Sort lanes by tab ID
    lanes.sort((a, b) => a.tabId - b.tabId);

    // Calculate time range
    const timestamps = events.map((e) => e.timestamp.getTime());
    const minTime = Math.min(...timestamps);
    const maxTime = Math.max(...timestamps);
    const timeRange = {
      start: new Date(minTime - 10000), // 10 seconds padding
      end: new Date(maxTime + 10000),
      duration: maxTime - minTime,
    };

    // Create 5-second time windows
    const windows: Array<{ start: Date; end: Date; label: string }> = [];
    const windowDuration = 5 * 1000; // 5 seconds in milliseconds
    let currentStart = new Date(Math.floor(timeRange.start.getTime() / windowDuration) * windowDuration);

    while (currentStart.getTime() <= timeRange.end.getTime()) {
      const currentEnd = new Date(currentStart.getTime() + windowDuration);
      const label = currentStart.toLocaleTimeString("en-US", {
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
      windows.push({ start: currentStart, end: currentEnd, label });
      currentStart = currentEnd;
    }

    return { tabLanes: lanes, timeRange, timeWindows: windows };
  }, [data]);

  // Get events at cursor time
  const eventsAtCursor = useMemo(() => {
    if (!cursorTime) return [];

    const cursorTimeMs = cursorTime.getTime();
    return tabLanes.flatMap((lane) =>
      lane.events.filter((event) => {
        const eventTime = event.timestamp.getTime();
        return Math.abs(eventTime - cursorTimeMs) < 1000; // Within 1 second
      })
    );
  }, [cursorTime, tabLanes]);

  // Convert timestamp to x position
  const getXPosition = useCallback(
    (timestamp: Date): number => {
      const timeMs = timestamp.getTime();
      const startMs = timeRange.start.getTime();
      const duration = timeRange.duration;
      return ((timeMs - startMs) / duration) * 100;
    },
    [timeRange]
  );

  // Helper function to find nearest events for each tab within tolerance
  const findNearestEvents = useCallback(
    (targetTime: Date, toleranceMs: number = 1000) => {
      const result: ChartEvent[] = [];

      for (const lane of tabLanes) {
        let nearestEvent: ChartEvent | null = null;
        let minTimeDiff = Infinity;

        for (const event of lane.events) {
          if (!event.timestamp || isNaN(event.timestamp.getTime())) {
            continue; // Skip invalid timestamps
          }

          const timeDiff = Math.abs(event.timestamp.getTime() - targetTime.getTime());
          if (timeDiff <= toleranceMs && timeDiff < minTimeDiff) {
            nearestEvent = event;
            minTimeDiff = timeDiff;
          }
        }

        // Only include tabs that have events within tolerance
        if (nearestEvent) {
          result.push(nearestEvent);
        }
      }

      return result;
    },
    [tabLanes]
  );

  // Handle mouse interactions
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!chartRef.current) return;

      const rect = chartRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      // Alternative calculation using offset properties
      // const x = e.clientX - chartRef.current.offsetLeft - chartRef.current.scrollLeft;
      const timePosition = (x / rect.width) * timeRange.duration + timeRange.start.getTime();
      const newCursorTime = new Date(timePosition);

      if (isDragging) {
        setCursorTime(newCursorTime);
      }

      // Only update tooltips and cursor position if not in sticky mode
      if (!isStickyMode) {
        // Find nearest events for each tab within 100ms tolerance
        const nearestEvents = findNearestEvents(newCursorTime, 10000);

        setCursorTime(newCursorTime); // Always set cursor time for the line
        setTooltipPosition({ x: e.clientX, y: e.clientY }); // Always set tooltip position
        setHoveredEvents(nearestEvents); // Always set hovered events (may be empty)
      }
    },
    [isDragging, timeRange, findNearestEvents, isStickyMode]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      setIsDragging(true);
      handleMouseMove(e);
    },
    [handleMouseMove]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (!chartRef.current) return;

      const rect = chartRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      // Alternative calculation using offset properties
      // const x = e.clientX - chartRef.current.offsetLeft - chartRef.current.scrollLeft;
      const timePosition = (x / rect.width) * timeRange.duration + timeRange.start.getTime();
      const clickedTime = new Date(timePosition);

      // Find nearest events for each tab within 1s tolerance
      const nearestEvents = findNearestEvents(clickedTime, 1000);

      // Always enter sticky mode with the clicked time and nearest events
      setIsStickyMode(true);
      setStickyTime(clickedTime);
      setStickyEvents(nearestEvents);
      setCursorTime(clickedTime); // Keep cursor visible at sticky position
    },
    [timeRange, findNearestEvents]
  );

  const handleMouseLeave = useCallback(() => {
    if (!isStickyMode) {
      setHoveredEvents([]);
      setTooltipPosition(null);
      if (!isDragging) {
        setCursorTime(null);
      }
    }
  }, [isDragging, isStickyMode]);

  // Handle keyboard events for exiting sticky mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isStickyMode) {
        setIsStickyMode(false);
        setStickyTime(null);
        setStickyEvents([]);
        setHoveredEvents([]);
        setTooltipPosition(null);
        setCursorTime(null); // Clear cursor when exiting sticky mode
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isStickyMode]);

  // Handle clicks outside the chart to exit sticky mode
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (chartRef.current && !chartRef.current.contains(e.target as Node) && isStickyMode) {
        setIsStickyMode(false);
        setStickyTime(null);
        setStickyEvents([]);
        setHoveredEvents([]);
        setTooltipPosition(null);
        setCursorTime(null); // Clear cursor when exiting sticky mode
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isStickyMode]);

  // Format time for display
  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  // Format time with milliseconds for tooltips
  const formatPreciseTime = (date: Date): string => {
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const seconds = date.getSeconds().toString().padStart(2, "0");
    const milliseconds = date.getMilliseconds().toString().padStart(3, "0");

    return `${hours}:${minutes}:${seconds}.${milliseconds}`;
  };

  return (
    <div className="timeline-chart">
      <div className="chart-header">
        <h3>📊 Interactive Timeline Debugger</h3>
        <p>
          Timeline with {tabLanes.length} tabs, {tabLanes.reduce((sum, lane) => sum + lane.events.length, 0)} events, and {timeWindows.length} 5-second windows
        </p>
        <div className="timeline-info">
          <span className="info-item">
            ⏱️ Time Range: {formatTime(timeRange.start)} - {formatTime(timeRange.end)}
          </span>
          <span className="info-item">🎯 Snap Tolerance: ±1s</span>
          <span className="info-item">📏 Window Size: 5 seconds</span>
        </div>
        {isStickyMode && stickyTime && (
          <div className="sticky-mode-indicator">
            <span className="sticky-icon">📌</span>
            <span className="sticky-text">
              Frozen at {formatPreciseTime(stickyTime)} • {stickyEvents.length} events
            </span>
            <span className="sticky-window">
              Window: {Math.floor(stickyTime.getTime() / 5000) * 5}s - {Math.floor(stickyTime.getTime() / 5000) * 5 + 5}s
            </span>
            <span className="sticky-hint">(Click elsewhere, press Esc, or close tooltip to unfreeze)</span>
          </div>
        )}
        {!isStickyMode && cursorTime && (
          <div className="cursor-info">
            <span className="cursor-time">{formatTime(cursorTime)}</span>
            <span className="cursor-events">{eventsAtCursor.length} events at this time</span>
            <span className="cursor-window">
              Window: {Math.floor(cursorTime.getTime() / 5000) * 5}s - {Math.floor(cursorTime.getTime() / 5000) * 5 + 5}s
            </span>
          </div>
        )}
      </div>

      <div className="chart-container">
        <div
          ref={chartRef}
          className="timeline-canvas"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          onClick={handleClick}
        >
          {/* Time axis */}
          <div className="time-axis">
            {Array.from({ length: 11 }, (_, i) => {
              const time = new Date(timeRange.start.getTime() + (i * timeRange.duration) / 10);
              return (
                <div key={i} className="time-tick" style={{ left: `${i * 10}%` }}>
                  <span className="time-label">{formatTime(time)}</span>
                </div>
              );
            })}
          </div>

          {/* Time windows background */}
          <div className="time-windows">
            {timeWindows.map((window, index) => {
              const startX = getXPosition(window.start);
              const endX = getXPosition(window.end);
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
          <div className="lanes-container">
            {tabLanes.map((lane) => (
              <div key={lane.tabId} className="tab-lane">
                <div className="lane-label">
                  <span className="tab-icon">📑</span>
                  <span className="tab-name">{lane.tabLabel}</span>
                  <span className="event-count">({lane.events.length})</span>
                </div>

                <div className="lane-events">
                  {lane.events.map((event) => {
                    const xPos = getXPosition(event.timestamp);
                    const yOffset = (event.stackLevel / lane.maxStackHeight) * 60; // Stack vertically

                    return (
                      <div
                        key={event.id}
                        className={`event-marker event-${event.type}`}
                        style={{
                          left: `${xPos}%`,
                          top: `${yOffset}px`,
                        }}
                        title={`${event.label} at ${formatTime(event.timestamp)} (User ${event.userId})`}
                      >
                        <div className="event-dot"></div>
                        <div className="event-label">{event.label}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Interactive cursor - always show when cursor time is set */}
          {(cursorTime || (isStickyMode && stickyTime)) && (
            <div
              className={`timeline-cursor ${isStickyMode ? "sticky-cursor" : ""}`}
              style={{
                left: `${getXPosition(isStickyMode && stickyTime ? stickyTime : cursorTime!)}%`,
              }}
            >
              <div className="cursor-line"></div>
              <div className="cursor-handle">{isStickyMode ? "📌" : "⋮"}</div>
            </div>
          )}
        </div>

        {/* Enhanced tooltip for hovered events or sticky mode - moved outside timeline-canvas */}
        {((tooltipPosition && !isStickyMode) || (isStickyMode && stickyTime)) && (
          <div
            className={`event-tooltip ${isStickyMode ? "sticky-tooltip" : ""}`}
            style={{
              left: isStickyMode ? "50vw" : tooltipPosition ? `${tooltipPosition.x + 10}px` : "0px",
              top: isStickyMode ? "50vh" : tooltipPosition ? `${tooltipPosition.y - 10}px` : "0px",
              transform: isStickyMode ? "translate(-50%, -50%)" : "none",
              position: "fixed",
            }}
          >
            <div className="tooltip-header">
              <span className="tooltip-time">
                {isStickyMode && stickyTime ? formatPreciseTime(stickyTime) : cursorTime ? formatPreciseTime(cursorTime) : ""}
              </span>
              <span className="tooltip-count">
                {isStickyMode ? stickyEvents.length : hoveredEvents.length} tab
                {(isStickyMode ? stickyEvents.length : hoveredEvents.length) !== 1 ? "s" : ""} with events
              </span>
              {isStickyMode && (
                <button
                  className="tooltip-close"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsStickyMode(false);
                    setStickyTime(null);
                    setStickyEvents([]);
                    setHoveredEvents([]);
                    setTooltipPosition(null);
                    setCursorTime(null); // Clear cursor when closing tooltip
                  }}
                  title="Close tooltip and unfreeze cursor (Esc)"
                >
                  ✕
                </button>
              )}
            </div>
            <div className="tooltip-events">
              {(isStickyMode ? stickyEvents : hoveredEvents).length > 0 ? (
                (isStickyMode ? stickyEvents : hoveredEvents).map((event) => (
                  <div key={event.id} className={`tooltip-event event-${event.type}`}>
                    <div className="event-summary">
                      <span className="event-tab">Tab {event.tabId}</span>
                      <span className="event-scope">{event.scope || event.type}</span>
                      <span className="event-detail">{event.label}</span>
                    </div>
                    <div className="event-description">
                      <strong>{event.property}</strong> executed by <em>User {event.userId}</em>
                      {event.scope && <span className="scope-info"> in {event.scope} context</span>}
                    </div>
                    <div className="event-timing">
                      <span className="window-info">
                        5s Window: {Math.floor(event.timestamp.getTime() / 5000) * 5}s - {Math.floor(event.timestamp.getTime() / 5000) * 5 + 5}s
                      </span>
                    </div>
                    <div className="event-meta">
                      <span className="event-user">User {event.userId}</span>
                      <span className="event-id">ID: {event.id}</span>
                      {event.parentId && <span className="event-parent">Parent: {event.parentId}</span>}
                    </div>
                    <div className="event-hierarchy">
                      <span className="hierarchy-path">
                        Tab {event.tabId} → {event.scope || "Action"} → {event.property}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-events-message">No events within 1s of this timestamp</div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Events at cursor panel */}
      {eventsAtCursor.length > 0 && (
        <div className="events-at-cursor">
          <h4>Events at {cursorTime ? formatTime(cursorTime) : ""}</h4>
          <div className="events-list">
            {eventsAtCursor.map((event: ChartEvent) => (
              <div key={event.id} className={`cursor-event event-${event.type}`}>
                <span className="event-tab">Tab {event.tabId}</span>
                <span className="event-type">{event.type}</span>
                <span className="event-label">{event.label}</span>
                <span className="event-user">User {event.userId}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TimelineChart;
