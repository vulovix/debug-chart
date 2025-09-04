import type { TimelineEvent } from "./types";

export const sampleEvents: TimelineEvent[] = [
  // Morning session - 9:00 AM
  { id: 1, userId: 1, property: undefined, parentId: null, scope: "page", tabId: 1, action: "loadData", date: "2025-09-03T09:00:00.000Z" },
  { id: 2, userId: 1, property: undefined, parentId: 4, scope: "widget", tabId: 1, action: "click", date: "2025-09-03T09:00:01.250Z" },
  { id: 3, userId: 2, property: undefined, parentId: null, scope: "left", tabId: 2, action: "loadSettings", date: "2025-09-03T09:00:01.500Z" },
  { id: 4, userId: 1, property: undefined, parentId: null, scope: "page", tabId: 1, action: "submitForm", date: "2025-09-03T09:00:03.000Z" },
  { id: 5, userId: 3, property: undefined, parentId: null, scope: "page", tabId: 3, action: "loadData", date: "2025-09-03T09:00:03.245Z" },
  { id: 6, userId: 2, property: undefined, parentId: 5, scope: "widget", tabId: 2, action: "click", date: "2025-09-03T09:00:04.100Z" },
  { id: 7, userId: 4, property: undefined, parentId: null, scope: "page", tabId: 4, action: "loadData", date: "2025-09-03T09:00:05.000Z" },
  { id: 8, userId: 5, property: undefined, parentId: null, scope: "left", tabId: 5, action: "loadSettings", date: "2025-09-03T09:00:05.500Z" },
  { id: 9, userId: 6, property: undefined, parentId: null, scope: "page", tabId: 6, action: "loadData", date: "2025-09-03T09:00:06.000Z" },
  { id: 10, userId: 7, property: undefined, parentId: null, scope: "widget", tabId: 7, action: "click", date: "2025-09-03T09:00:06.500Z" },
  { id: 11, userId: 8, property: undefined, parentId: null, scope: "page", tabId: 8, action: "loadData", date: "2025-09-03T09:00:07.000Z" },
  { id: 12, userId: 9, property: undefined, parentId: null, scope: "left", tabId: 9, action: "loadSettings", date: "2025-09-03T09:00:07.500Z" },
  { id: 13, userId: 10, property: undefined, parentId: null, scope: "page", tabId: 10, action: "loadData", date: "2025-09-03T09:00:08.000Z" },
  { id: 14, userId: 11, property: undefined, parentId: null, scope: "widget", tabId: 11, action: "click", date: "2025-09-03T09:00:08.500Z" },
  { id: 15, userId: 12, property: undefined, parentId: null, scope: "page", tabId: 12, action: "loadData", date: "2025-09-03T09:00:09.000Z" },

  // Gap 1: ~3 hours later - 12:00 PM (3h gap)
  { id: 16, userId: 1, property: undefined, parentId: null, scope: "page", tabId: 1, action: "loadData", date: "2025-09-03T12:00:00.000Z" },
  { id: 17, userId: 2, property: undefined, parentId: null, scope: "left", tabId: 2, action: "loadSettings", date: "2025-09-03T12:00:01.000Z" },
  { id: 18, userId: 3, property: undefined, parentId: null, scope: "page", tabId: 3, action: "loadData", date: "2025-09-03T12:00:02.000Z" },

  // Gap 2: ~4 hours later - 4:00 PM (4h gap)
  { id: 19, userId: 4, property: undefined, parentId: null, scope: "page", tabId: 4, action: "loadData", date: "2025-09-03T16:00:00.000Z" },
  { id: 20, userId: 5, property: undefined, parentId: null, scope: "left", tabId: 5, action: "loadSettings", date: "2025-09-03T16:00:01.000Z" },
  { id: 21, userId: 6, property: undefined, parentId: null, scope: "page", tabId: 6, action: "loadData", date: "2025-09-03T16:00:02.000Z" },

  // Gap 3: ~2 hours later - 6:00 PM (2h gap)
  { id: 22, userId: 7, property: undefined, parentId: null, scope: "widget", tabId: 7, action: "click", date: "2025-09-03T18:00:00.000Z" },
  { id: 23, userId: 8, property: undefined, parentId: null, scope: "page", tabId: 8, action: "loadData", date: "2025-09-03T18:00:01.000Z" },
  { id: 24, userId: 9, property: undefined, parentId: null, scope: "left", tabId: 9, action: "loadSettings", date: "2025-09-03T18:00:02.000Z" },

  // Gap 4: ~6 hours later - 12:00 AM next day (6h gap)
  { id: 25, userId: 10, property: undefined, parentId: null, scope: "page", tabId: 10, action: "loadData", date: "2025-09-04T00:00:00.000Z" },
  { id: 26, userId: 11, property: undefined, parentId: null, scope: "widget", tabId: 11, action: "click", date: "2025-09-04T00:00:01.000Z" },
  { id: 27, userId: 12, property: undefined, parentId: null, scope: "page", tabId: 12, action: "loadData", date: "2025-09-04T00:00:02.000Z" },

  // Gap 5: ~8 hours later - 8:00 AM next day (8h gap)
  { id: 28, userId: 1, property: undefined, parentId: null, scope: "page", tabId: 1, action: "loadData", date: "2025-09-04T08:00:00.000Z" },
  { id: 29, userId: 2, property: undefined, parentId: null, scope: "left", tabId: 2, action: "loadSettings", date: "2025-09-04T08:00:01.000Z" },
  { id: 30, userId: 3, property: undefined, parentId: null, scope: "page", tabId: 3, action: "loadData", date: "2025-09-04T08:00:02.000Z" },
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
      tabId: Math.ceil(Math.random() * 12),
      action: Math.random() > 0.5 ? "click" : undefined,
      date: new Date(t).toISOString(),
    });
  }
  return out;
}
