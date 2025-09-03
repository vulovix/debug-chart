import type { BaseItem, TreeNode } from "./TreeItem";

export interface TimeWindow {
  windowId: string;
  startTime: Date;
  endTime: Date;
  timeLabel: string; // e.g., "12:00:00–12:00:05"
  activities: TimelineActivity[];
  totalItems: number;
  isExpanded?: boolean;
}

export interface TimelineActivity {
  tabId: number;
  tabLabel: string;
  containers: TimelineContainer[];
  independentActions: BaseItem[];
}

export interface TimelineContainer {
  type: "page" | "left";
  item: BaseItem;
  widgets: TimelineWidget[];
  actions: BaseItem[];
}

export interface TimelineWidget {
  item: BaseItem;
  actions: BaseItem[];
}

export interface TimelineNode extends TreeNode {
  timeWindow?: string;
  startTime?: string;
  endTime?: string;
  exactTimestamp?: string; // Precise timestamp for individual events
  activityType?: "timeWindow" | "tab" | "container" | "widget" | "action";
  itemCount?: number;
  activityCount?: number;
}
