import type { TimelineEvent } from "./types";

export const sampleEvents: TimelineEvent[] = [
  { id: 1, userId: 1, property: undefined, parentId: null, scope: "page", tabId: 1, action: "loadData", date: "2025-09-03T12:00:00.000Z" },
  { id: 2, userId: 1, property: undefined, parentId: 4, scope: "widget", tabId: 1, action: "click", date: "2025-09-03T12:00:01.250Z" },
  { id: 3, userId: 2, property: undefined, parentId: null, scope: "left", tabId: 2, action: "loadSettings", date: "2025-09-03T12:00:01.500Z" },
  { id: 4, userId: 1, property: undefined, parentId: null, scope: "page", tabId: 1, action: "submitForm", date: "2025-09-03T12:00:03.000Z" },
  { id: 5, userId: 3, property: undefined, parentId: null, scope: "page", tabId: 3, action: "loadData", date: "2025-09-03T12:00:03.245Z" },
  { id: 6, userId: 2, property: undefined, parentId: 5, scope: "widget", tabId: 2, action: "click", date: "2025-09-03T12:00:04.100Z" },
];

export function makeEvents(count = 1200): TimelineEvent[] {
  const out: TimelineEvent[] = [];
  const base = new Date("2025-09-03T12:00:00.000Z").getTime();
  for (let i = 0; i < count; i++) {
    const t = base + Math.floor(Math.random() * 120000);
    out.push({
      id: 1000 + i,
      userId: Math.ceil(Math.random() * 5),
      property: "p" + (i % 10),
      parentId: Math.random() > 0.8 ? Math.ceil(Math.random() * 20) : null,
      scope: Math.random() > 0.7 ? "widget" : Math.random() > 0.5 ? "left" : "page",
      tabId: Math.ceil(Math.random() * 6),
      action: Math.random() > 0.5 ? "click" : undefined,
      date: new Date(t).toISOString(),
    });
  }
  return out;
}
