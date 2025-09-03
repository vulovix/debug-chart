import type { TimelineEvent, Span, Hierarchy } from "./types";

function addToHierarchy(h: Hierarchy, ev: TimelineEvent) {
  const tabKey = `tab-${ev.tabId}`;
  let tab = h[tabKey];
  if (!tab) {
    tab = { tabId: ev.tabId, containers: {}, events: [] };
    h[tabKey] = tab;
  }
  tab.events.push(ev);

  const scope = ev.scope ?? "page";
  let container = tab.containers[scope];
  if (!container) {
    container = { name: scope, widgets: {}, events: [] };
    tab.containers[scope] = container;
  }
  container.events.push(ev);

  const widgetId = ev.parentId != null ? `w-${ev.parentId}` : "root";
  let widget = container.widgets[widgetId];
  if (!widget) {
    widget = { id: ev.parentId ?? 0, events: [] };
    container.widgets[widgetId] = widget;
  }
  widget.events.push(ev);
}

export function buildSpans(events: TimelineEvent[]): Span[] {
  if (!events || events.length === 0) return [];
  // sort by date
  const evs = [...events].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const buckets = new Map<number, TimelineEvent[]>();

  for (const ev of evs) {
    const d = new Date(ev.date);
    const key = Math.floor(d.getTime() / 5000) * 5000;
    const arr = buckets.get(key) ?? [];
    arr.push(ev);
    buckets.set(key, arr);
  }

  const spans: Span[] = [];

  for (const [key, evList] of Array.from(buckets.entries()).sort((a, b) => a[0] - b[0])) {
    const from = new Date(key);
    const to = new Date(key + 5000);
    const hierarchy: Hierarchy = {};
    for (const ev of evList) addToHierarchy(hierarchy, ev);

    spans.push({ from: from.toISOString(), to: to.toISOString(), events: evList, hierarchy });
  }

  return spans;
}

export function buildHierarchy(events: TimelineEvent[]): Hierarchy {
  const h: Hierarchy = {};
  for (const ev of events) addToHierarchy(h, ev);
  return h;
}
