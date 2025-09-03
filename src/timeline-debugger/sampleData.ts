import type { Event } from "./types";

export const sampleEvents: Event[] = [
  { id: 1, userId: 1, property: "x", parentId: null, scope: null, tabId: 1, date: "2025-09-03T12:00:00.000Z" },
  { id: 2, userId: 2, property: "y", parentId: null, scope: "page", tabId: 1, action: "loadData", date: "2025-09-03T12:00:01.500Z" },
  { id: 3, userId: 3, property: "z", parentId: null, scope: "left", tabId: 2, action: "loadSettings", date: "2025-09-03T12:00:02.250Z" },
  { id: 4, userId: 1, property: "z", parentId: 2, scope: "widget", tabId: 1, action: "click", date: "2025-09-03T12:00:03.000Z" },
];
