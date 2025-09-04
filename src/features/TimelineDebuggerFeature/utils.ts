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

  for (const [, evList] of Array.from(buckets.entries()).sort((a, b) => a[0] - b[0])) {
    if (evList.length === 0) continue;
    const sorted = evList.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const from = sorted[0].date;
    const to = sorted[sorted.length - 1].date;
    const hierarchy: Hierarchy = {};
    for (const ev of evList) addToHierarchy(hierarchy, ev);

    spans.push({ from, to, events: evList, hierarchy });
  }

  return spans;
}

export function buildHierarchy(events: TimelineEvent[]): Hierarchy {
  const h: Hierarchy = {};
  for (const ev of events) addToHierarchy(h, ev);
  return h;
}

export function formatTimeIso(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toISOString().replace("T", " ").replace("Z", "");
  } catch {
    return "Invalid Date";
  }
}

export function formatTimeShort(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toISOString().substr(11, 8);
  } catch {
    return "00:00:00";
  }
}

export function getDotColor(scope: string | null | undefined): string {
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

export function lightenColor(color: string, factor: number): string {
  try {
    // Simple color lightening by increasing RGB values
    const hex = color.replace("#", "");
    const r = Math.min(255, Math.floor(parseInt(hex.substr(0, 2), 16) * (1 + factor)));
    const g = Math.min(255, Math.floor(parseInt(hex.substr(2, 2), 16) * (1 + factor)));
    const b = Math.min(255, Math.floor(parseInt(hex.substr(4, 2), 16) * (1 + factor)));
    return `rgb(${r}, ${g}, ${b})`;
  } catch {
    return color;
  }
}
