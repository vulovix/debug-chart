import type { TimelineEvent } from "./data";

export interface GroupedEvents {
  [tabId: number]: TimelineEvent[];
}

export interface TimeRange {
  start: Date;
  end: Date;
  duration: number;
}

export function groupEventsByTab(events: TimelineEvent[]): GroupedEvents {
  const grouped: GroupedEvents = {};
  events.forEach((event) => {
    if (!grouped[event.tabId]) {
      grouped[event.tabId] = [];
    }
    grouped[event.tabId].push(event);
  });
  return grouped;
}

export function getEventsNearTime(events: TimelineEvent[], cursorTime: Date, toleranceMs: number = 1000): TimelineEvent[] {
  return events.filter((event) => {
    const eventTime = new Date(event.date);
    return Math.abs(eventTime.getTime() - cursorTime.getTime()) <= toleranceMs;
  });
}

export function calculateTimeRange(events: TimelineEvent[]): TimeRange {
  if (events.length === 0) {
    const now = new Date();
    return {
      start: new Date(now.getTime() - 60000), // 1 minute ago
      end: new Date(now.getTime() + 60000), // 1 minute from now
      duration: 120000,
    };
  }

  const timestamps = events.map((event) => new Date(event.date).getTime());
  const minTime = Math.min(...timestamps);
  const maxTime = Math.max(...timestamps);

  return {
    start: new Date(minTime - 10000), // 10 seconds padding
    end: new Date(maxTime + 10000),
    duration: maxTime - minTime + 20000,
  };
}

export function getTimePosition(timestamp: Date, timeRange: TimeRange): number {
  const timeMs = timestamp.getTime();
  const startMs = timeRange.start.getTime();
  const duration = timeRange.duration;
  return ((timeMs - startMs) / duration) * 100;
}

export function getTimestampFromPosition(xPercent: number, timeRange: TimeRange): Date {
  const timeMs = timeRange.start.getTime() + (xPercent / 100) * timeRange.duration;
  return new Date(timeMs);
}

export function formatPreciseTime(date: Date): string {
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const seconds = date.getSeconds().toString().padStart(2, "0");
  const milliseconds = date.getMilliseconds().toString().padStart(3, "0");
  return `${hours}:${minutes}:${seconds}.${milliseconds}`;
}

export function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function getEventHierarchyPath(event: TimelineEvent): string {
  const parts = [`Tab ${event.tabId}`];

  if (event.scope) {
    parts.push(event.scope);
  }

  if (event.action) {
    parts.push(event.action);
  } else {
    parts.push(event.property);
  }

  return parts.join(" → ");
}

export function createTimeWindows(timeRange: TimeRange, windowSizeSeconds: number = 5): Array<{ start: Date; end: Date; label: string }> {
  const windows: Array<{ start: Date; end: Date; label: string }> = [];
  const windowDuration = windowSizeSeconds * 1000; // Convert to milliseconds

  let currentStart = new Date(Math.floor(timeRange.start.getTime() / windowDuration) * windowDuration);

  while (currentStart.getTime() <= timeRange.end.getTime()) {
    const currentEnd = new Date(currentStart.getTime() + windowDuration);
    const label = formatTime(currentStart);
    windows.push({ start: currentStart, end: currentEnd, label });
    currentStart = currentEnd;
  }

  return windows;
}
