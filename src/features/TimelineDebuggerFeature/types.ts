export type TimelineEvent = {
  id: number;
  userId?: number;
  property?: string;
  parentId?: number | null;
  scope?: null | "page" | "left" | "widget";
  tabId: number;
  action?: string;
  date: string; // ISO
};

export type WidgetNode = {
  id: number;
  events: TimelineEvent[];
};

export type ContainerNode = {
  name: string; // 'page' | 'left'
  widgets: Record<string, WidgetNode>;
  events: TimelineEvent[];
};

export type TabNode = {
  tabId: number;
  containers: Record<string, ContainerNode>;
  events: TimelineEvent[];
};

export type Hierarchy = Record<string, TabNode>;

export type Span = {
  from: string; // ISO
  to: string; // ISO
  events: TimelineEvent[];
  hierarchy: Hierarchy;
};
