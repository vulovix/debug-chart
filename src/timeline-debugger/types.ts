export interface Event {
  id: number;
  userId: number;
  property: string;
  parentId: number | null;
  scope: null | "page" | "left" | "widget";
  tabId: number;
  action?: string;
  date: string; // ISOString
}

export interface TimeSpan {
  start: Date;
  end: Date;
  events: Event[];
}

export interface TabHierarchy {
  tabId: number;
  containers: {
    scope: "page" | "left";
    widgets: {
      id: number;
      events: Event[];
    }[];
    events: Event[];
  }[];
  events: Event[];
}

export interface ProcessedData {
  spans: TimeSpan[];
  tabs: TabHierarchy[];
  minTime: Date;
  maxTime: Date;
}
