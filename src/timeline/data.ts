import type { BaseItem } from "../types/TreeItem";

export interface TimelineEvent extends Omit<BaseItem, "date"> {
  action?: string;
  date: Date;
}

export function generateEvents(count: number = 1000): TimelineEvent[] {
  const tabs = [1, 2, 3, 4, 5];
  const scopes: Array<"page" | "left" | "widget" | null> = [null, "page", "left", "widget"];
  const actions = ["loadData", "loadSettings", "click", "submit", "render", "update", "delete", "create"];

  const events: TimelineEvent[] = [];
  const baseTime = new Date();
  baseTime.setHours(9, 0, 0, 0); // Start at 9 AM

  for (let i = 0; i < count; i++) {
    const tabId = tabs[Math.floor(Math.random() * tabs.length)];
    const userId = Math.floor(Math.random() * 10) + 1;
    const scope = scopes[Math.floor(Math.random() * scopes.length)];
    const action = actions[Math.floor(Math.random() * actions.length)];

    // Create realistic timestamps spread across 2 hours
    const hourOffset = Math.floor((i * 7) / count) % 2; // 0-1 hours
    const minuteOffset = Math.floor(Math.random() * 60);
    const secondOffset = Math.floor(Math.random() * 60);
    const millisecondOffset = Math.floor(Math.random() * 1000);

    const eventTime = new Date(baseTime);
    eventTime.setHours(baseTime.getHours() + hourOffset);
    eventTime.setMinutes(minuteOffset);
    eventTime.setSeconds(secondOffset);
    eventTime.setMilliseconds(millisecondOffset);

    // Determine parent relationships
    let parentId: number | null = null;
    if (scope === "widget" && Math.random() > 0.3) {
      // 70% of widgets have a parent container
      parentId = Math.floor(Math.random() * Math.min(i, 100)) + 1;
    } else if (scope === null && Math.random() > 0.8) {
      // 20% of root actions have a parent
      parentId = Math.floor(Math.random() * Math.min(i, 50)) + 1;
    }

    events.push({
      id: i + 1,
      userId,
      property: scope === "widget" ? `widget_${action}` : action,
      parentId,
      scope,
      tabId,
      action,
      date: eventTime,
    });
  }

  // Sort by timestamp
  return events.sort((a, b) => {
    const timeA = new Date(a.date).getTime();
    const timeB = new Date(b.date).getTime();
    return timeA - timeB;
  });
}

// Generate the static dataset
export const staticEvents = generateEvents(1200);
