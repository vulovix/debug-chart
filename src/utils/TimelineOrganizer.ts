import type { BaseItem } from "../types/TreeItem";
import type { TimeWindow, TimelineActivity, TimelineWidget, TimelineNode } from "../types/TimelineItem";

export class TimelineOrganizer {
  private items: BaseItem[];
  private timeWindowSize: number; // seconds

  constructor(items: BaseItem[], timeWindowSize: number = 5) {
    this.items = items;
    this.timeWindowSize = timeWindowSize;
  }

  public organizeIntoTimeline(): TimeWindow[] {
    // First, parse dates and group items into 5-second windows
    const timeWindows = this.groupIntoTimeWindows();

    // Convert to TimeWindow objects with activities
    const windows: TimeWindow[] = [];

    for (const [windowId, windowData] of timeWindows) {
      const activities = this.organizeWindowActivities(windowData.items);

      windows.push({
        windowId,
        startTime: windowData.startTime,
        endTime: windowData.endTime,
        timeLabel: this.formatTimeWindow(windowData.startTime, windowData.endTime),
        activities,
        totalItems: windowData.items.length,
        isExpanded: false,
      });
    }

    return windows.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
  }

  private groupIntoTimeWindows(): Map<string, { startTime: Date; endTime: Date; items: BaseItem[] }> {
    const windows = new Map<string, { startTime: Date; endTime: Date; items: BaseItem[] }>();

    for (const item of this.items) {
      const itemDate = this.parseItemDate(item);
      if (!itemDate) continue;

      // Create 5-second window boundaries
      const windowStart = this.getWindowStart(itemDate);
      const windowEnd = new Date(windowStart.getTime() + this.timeWindowSize * 1000);

      const windowId = this.createWindowId(windowStart);

      if (!windows.has(windowId)) {
        windows.set(windowId, {
          startTime: windowStart,
          endTime: windowEnd,
          items: [],
        });
      }

      windows.get(windowId)!.items.push(item);
    }

    return windows;
  }

  private parseItemDate(item: BaseItem): Date | null {
    try {
      // Handle different date formats
      if (item.date === "Date") {
        // Generate a random timestamp based on item properties for demo data
        const baseTime = new Date();
        baseTime.setHours(9, 0, 0, 0); // Start at 9 AM

        // Create varied timestamps based on item ID and properties
        const hourOffset = Math.floor((item.id + item.tabId) / 50) % 8; // 0-7 hours
        const minuteOffset = (item.id * 3 + item.userId) % 60; // 0-59 minutes
        const secondOffset = (item.id * 7) % 60; // 0-59 seconds
        // Add milliseconds for more precision
        const millisecondOffset = (item.id * item.userId * 13) % 1000; // 0-999 milliseconds

        return new Date(baseTime.getTime() + hourOffset * 60 * 60 * 1000 + minuteOffset * 60 * 1000 + secondOffset * 1000 + millisecondOffset);
      }

      // If it's already a valid date string
      const parsed = new Date(item.date);
      return isNaN(parsed.getTime()) ? null : parsed;
    } catch {
      return null;
    }
  }

  private getWindowStart(date: Date): Date {
    // Round down to the nearest 5-second boundary
    const seconds = date.getSeconds();

    const roundedSeconds = Math.floor(seconds / this.timeWindowSize) * this.timeWindowSize;

    return new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes(), roundedSeconds, 0);
  }

  private createWindowId(windowStart: Date): string {
    return `${windowStart.getHours().toString().padStart(2, "0")}:${windowStart.getMinutes().toString().padStart(2, "0")}:${windowStart
      .getSeconds()
      .toString()
      .padStart(2, "0")}`;
  }

  private formatTimeWindow(startTime: Date, endTime: Date): string {
    const formatTime = (date: Date) =>
      `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}:${date.getSeconds().toString().padStart(2, "0")}`;

    return `${formatTime(startTime)}–${formatTime(endTime)}`;
  }

  private organizeWindowActivities(items: BaseItem[]): TimelineActivity[] {
    // Group by tab first
    const tabGroups = new Map<number, BaseItem[]>();

    for (const item of items) {
      if (!tabGroups.has(item.tabId)) {
        tabGroups.set(item.tabId, []);
      }
      tabGroups.get(item.tabId)!.push(item);
    }

    const activities: TimelineActivity[] = [];

    for (const [tabId, tabItems] of tabGroups) {
      const activity: TimelineActivity = {
        tabId,
        tabLabel: `Tab ${tabId}`,
        containers: [],
        independentActions: [],
      };

      // Separate containers, widgets, and actions
      const containers = new Map<number, BaseItem>();
      const widgets = new Map<number, BaseItem>();
      const actions: BaseItem[] = [];

      for (const item of tabItems) {
        if (item.scope === "page" || item.scope === "left") {
          if (!item.parentId) {
            containers.set(item.id, item);
          }
        } else if (item.scope === "widget") {
          widgets.set(item.id, item);
        } else {
          actions.push(item);
        }
      }

      // Build container structures
      for (const [containerId, containerItem] of containers) {
        const containerWidgets: TimelineWidget[] = [];
        const containerActions: BaseItem[] = [];

        // Find widgets belonging to this container
        for (const [widgetId, widgetItem] of widgets) {
          if (widgetItem.parentId === containerId) {
            const widgetActions = actions.filter((action) => action.parentId === widgetId);
            containerWidgets.push({
              item: widgetItem,
              actions: widgetActions,
            });
          }
        }

        // Find actions belonging directly to this container
        containerActions.push(...actions.filter((action) => action.parentId === containerId));

        activity.containers.push({
          type: containerItem.scope as "page" | "left",
          item: containerItem,
          widgets: containerWidgets,
          actions: containerActions,
        });
      }

      // Add orphaned widgets (widgets without containers in this time window)
      for (const [widgetId, widgetItem] of widgets) {
        if (!containers.has(widgetItem.parentId || -1)) {
          const widgetActions = actions.filter((action) => action.parentId === widgetId);

          // Create a virtual container entry for orphaned widgets
          activity.containers.push({
            type: "page", // Default type for orphaned widgets
            item: {
              ...widgetItem,
              property: `orphaned_container_${widgetItem.property}`,
              scope: "page",
              parentId: null,
            },
            widgets: [
              {
                item: widgetItem,
                actions: widgetActions,
              },
            ],
            actions: [],
          });
        }
      }

      // Find independent actions (not belonging to any container or widget in this window)
      const processedActionIds = new Set<number>();
      activity.containers.forEach((container) => {
        container.actions.forEach((action) => processedActionIds.add(action.id));
        container.widgets.forEach((widget) => widget.actions.forEach((action) => processedActionIds.add(action.id)));
      });

      activity.independentActions = actions.filter((action) => !processedActionIds.has(action.id));

      activities.push(activity);
    }

    return activities.sort((a, b) => a.tabId - b.tabId);
  }

  public organizeIntoTimelineTree(): TimelineNode[] {
    const timeWindows = this.organizeIntoTimeline();
    const treeNodes: TimelineNode[] = [];

    for (const window of timeWindows) {
      const windowNode: TimelineNode = {
        id: `window_${window.windowId}`,
        type: "timeWindow",
        label: `⏰ ${window.timeLabel} (${window.totalItems} items)`,
        timeWindow: window.windowId,
        startTime: window.startTime.toISOString(),
        endTime: window.endTime.toISOString(),
        activityType: "timeWindow",
        activityCount: window.totalItems,
        data: {
          id: parseInt(window.windowId.replace(/:/g, "")) || 0,
          userId: 0,
          property: `timeWindow_${window.windowId}`,
          parentId: null,
          scope: null,
          tabId: 0,
          date: window.startTime.toISOString(),
        },
        children: [],
        isExpanded: false,
      };

      // Collect all items in this window with their exact timestamps
      const allWindowItems: Array<{ item: BaseItem; exactTime: Date }> = [];

      for (const activity of window.activities) {
        // Add container items
        for (const container of activity.containers) {
          const containerTime = this.parseItemDate(container.item);
          if (containerTime) {
            allWindowItems.push({ item: container.item, exactTime: containerTime });
          }

          // Add widgets
          for (const widget of container.widgets) {
            const widgetTime = this.parseItemDate(widget.item);
            if (widgetTime) {
              allWindowItems.push({ item: widget.item, exactTime: widgetTime });
            }

            // Add widget actions
            for (const action of widget.actions) {
              const actionTime = this.parseItemDate(action);
              if (actionTime) {
                allWindowItems.push({ item: action, exactTime: actionTime });
              }
            }
          }

          // Add container actions
          for (const action of container.actions) {
            const actionTime = this.parseItemDate(action);
            if (actionTime) {
              allWindowItems.push({ item: action, exactTime: actionTime });
            }
          }
        }

        // Add independent actions
        for (const action of activity.independentActions) {
          const actionTime = this.parseItemDate(action);
          if (actionTime) {
            allWindowItems.push({ item: action, exactTime: actionTime });
          }
        }
      }

      // Sort items by exact timestamp
      allWindowItems.sort((a, b) => a.exactTime.getTime() - b.exactTime.getTime());

      // Create timeline nodes with exact timestamps, grouped by hierarchy
      const tabGroups = new Map<number, Array<{ item: BaseItem; exactTime: Date }>>();

      for (const itemWithTime of allWindowItems) {
        const tabId = itemWithTime.item.tabId;
        if (!tabGroups.has(tabId)) {
          tabGroups.set(tabId, []);
        }
        tabGroups.get(tabId)!.push(itemWithTime);
      }

      // Create tab nodes with chronologically sorted content
      for (const [tabId, tabItems] of tabGroups) {
        const tabNode: TimelineNode = {
          id: `tab_${window.windowId}_${tabId}`,
          type: "tab",
          label: `� Tab ${tabId} (${tabItems.length} events)`,
          activityType: "tab",
          activityCount: tabItems.length,
          data: {
            id: tabId,
            userId: 0,
            property: `tab_${tabId}`,
            parentId: null,
            scope: null,
            tabId: tabId,
            date: window.startTime.toISOString(),
          },
          children: [],
          isExpanded: false,
        };

        // Create chronologically ordered events within the tab
        for (const { item, exactTime } of tabItems) {
          const exactTimestamp = this.formatPreciseTimestamp(exactTime);
          const eventNode: TimelineNode = {
            id: `event_${window.windowId}_${item.id}_${exactTime.getTime()}`,
            type: this.getItemType(item),
            label: this.createEventLabel(item, exactTimestamp),
            exactTimestamp,
            activityType: this.getActivityType(item),
            activityCount: 1,
            data: item,
            children: [],
            isExpanded: false,
          };

          tabNode.children.push(eventNode);
        }

        windowNode.children.push(tabNode);
      }

      treeNodes.push(windowNode);
    }

    return treeNodes;
  }

  private getItemType(item: BaseItem): "page" | "left" | "widget" | "action" {
    if (item.scope === "page") return "page";
    if (item.scope === "left") return "left";
    if (item.scope === "widget") return "widget";
    return "action";
  }

  private getActivityType(item: BaseItem): "timeWindow" | "tab" | "container" | "widget" | "action" {
    if (item.scope === "page" || item.scope === "left") return "container";
    if (item.scope === "widget") return "widget";
    return "action";
  }

  private createEventLabel(item: BaseItem, timestamp: string): string {
    const icons = {
      page: "📄",
      left: "⬅️",
      widget: "🔧",
      action: "⚡",
    };

    const type = this.getItemType(item);
    const icon = icons[type];

    return `${icon} ${timestamp} - ${item.property} (User: ${item.userId})`;
  }

  private formatPreciseTimestamp(date: Date): string {
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const seconds = date.getSeconds().toString().padStart(2, "0");
    const milliseconds = date.getMilliseconds().toString().padStart(3, "0");

    return `${hours}:${minutes}:${seconds}.${milliseconds}`;
  }

  public getTimelineStats(windows: TimeWindow[]): {
    totalWindows: number;
    totalItems: number;
    averageItemsPerWindow: number;
    busiestWindow: string;
    maxItemsInWindow: number;
    timeSpan: string;
    windowSize: string;
  } {
    if (windows.length === 0) {
      return {
        totalWindows: 0,
        totalItems: 0,
        averageItemsPerWindow: 0,
        busiestWindow: "N/A",
        maxItemsInWindow: 0,
        timeSpan: "N/A",
        windowSize: `${this.timeWindowSize} seconds`,
      };
    }

    const totalItems = windows.reduce((sum, window) => sum + window.totalItems, 0);
    const busiestWindow = windows.reduce((max, window) => (window.totalItems > max.totalItems ? window : max));

    const startTime = windows[0].startTime;
    const endTime = windows[windows.length - 1].endTime;
    const formatTime = (date: Date) =>
      `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}:${date.getSeconds().toString().padStart(2, "0")}`;

    const timeSpan = `${formatTime(startTime)} to ${formatTime(endTime)}`;

    return {
      totalWindows: windows.length,
      totalItems,
      averageItemsPerWindow: Math.round((totalItems / windows.length) * 10) / 10, // Round to 1 decimal
      busiestWindow: busiestWindow.timeLabel,
      maxItemsInWindow: busiestWindow.totalItems,
      timeSpan,
      windowSize: `${this.timeWindowSize} seconds`,
    };
  }

  // Legacy methods for backward compatibility
  public organizeByTimeline(): TimeWindow[] {
    return this.organizeIntoTimeline();
  }
}
