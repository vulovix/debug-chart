import type { Event, TimeSpan, TabHierarchy, ProcessedData, NestedJSON } from "./types";

export function processEvents(events: Event[]): ProcessedData {
  const sortedEvents = events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const minTime = new Date(sortedEvents[0].date);
  const maxTime = new Date(sortedEvents[sortedEvents.length - 1].date);

  // Group into 5-second spans
  const spans: TimeSpan[] = [];
  let currentSpanStart = new Date(minTime);
  currentSpanStart.setSeconds(Math.floor(currentSpanStart.getSeconds() / 5) * 5);
  currentSpanStart.setMilliseconds(0);

  while (currentSpanStart < maxTime) {
    const spanEnd = new Date(currentSpanStart);
    spanEnd.setSeconds(spanEnd.getSeconds() + 5);
    const spanEvents = sortedEvents.filter((e) => {
      const eventTime = new Date(e.date);
      return eventTime >= currentSpanStart && eventTime < spanEnd;
    });
    spans.push({ start: new Date(currentSpanStart), end: new Date(spanEnd), events: spanEvents });
    currentSpanStart = spanEnd;
  }

  // Build tab hierarchy
  const tabMap = new Map<number, TabHierarchy>();
  for (const event of sortedEvents) {
    if (!tabMap.has(event.tabId)) {
      tabMap.set(event.tabId, {
        tabId: event.tabId,
        containers: [],
        events: [],
      });
    }
    const tab = tabMap.get(event.tabId)!;
    if (event.scope === null) {
      tab.events.push(event);
    } else if (event.scope === "page" || event.scope === "left") {
      let container = tab.containers.find((c) => c.scope === event.scope);
      if (!container) {
        container = { scope: event.scope, widgets: [], events: [] };
        tab.containers.push(container);
      }
      container.events.push(event);
    } else if (event.scope === "widget") {
      // Find parent container
      const parentEvent = sortedEvents.find((e) => e.id === event.parentId);
      if (parentEvent && (parentEvent.scope === "page" || parentEvent.scope === "left")) {
        let container = tab.containers.find((c) => c.scope === parentEvent.scope);
        if (!container) {
          container = { scope: parentEvent.scope, widgets: [], events: [] };
          tab.containers.push(container);
        }
        let widget = container.widgets.find((w) => w.id === event.id);
        if (!widget) {
          widget = { id: event.id, events: [] };
          container.widgets.push(widget);
        }
        widget.events.push(event);
      } else {
        // If no parent, add to tab
        tab.events.push(event);
      }
    }
  }

  const tabs = Array.from(tabMap.values());

  return { spans, tabs, minTime, maxTime };
}

export function getEventsAtTime(events: Event[], time: Date, toleranceMs: number = 50): Event[] {
  return events.filter((e) => {
    const eventTime = new Date(e.date);
    return Math.abs(eventTime.getTime() - time.getTime()) <= toleranceMs;
  });
}

export function getNestedJSON(processed: ProcessedData): NestedJSON {
  return {
    timeRange: {
      from: processed.minTime.toISOString(),
      to: processed.maxTime.toISOString(),
    },
    spans: processed.spans.map(span => ({
      from: span.start.toISOString(),
      to: span.end.toISOString(),
      eventCount: span.events.length,
      events: span.events.map(e => ({
        id: e.id,
        timestamp: e.date,
        tabId: e.tabId,
        scope: e.scope,
        action: e.action,
        property: e.property,
      })),
    })),
    hierarchy: processed.tabs.map(tab => ({
      tabId: tab.tabId,
      topLevelEvents: tab.events.length,
      containers: tab.containers.map(container => ({
        scope: container.scope,
        events: container.events.length,
        widgets: container.widgets.map(widget => ({
          id: widget.id,
          events: widget.events.length,
        })),
      })),
    })),
  };
}
