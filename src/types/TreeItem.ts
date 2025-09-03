export interface BaseItem {
  id: number;
  userId: number;
  property: string;
  parentId: number | null;
  scope: "page" | "left" | "widget" | null;
  tabId: number;
  date: string;
}

export interface TreeNode {
  id: number | string;
  type: "tab" | "page" | "left" | "widget" | "action" | "timeWindow";
  label: string;
  data: BaseItem;
  children: TreeNode[];
  isExpanded?: boolean;
}

export interface TabNode extends TreeNode {
  type: "tab";
  children: (PageNode | LeftNode | ActionNode)[];
}

export interface PageNode extends TreeNode {
  type: "page";
  children: (WidgetNode | ActionNode)[];
}

export interface LeftNode extends TreeNode {
  type: "left";
  children: (WidgetNode | ActionNode)[];
}

export interface WidgetNode extends TreeNode {
  type: "widget";
  children: ActionNode[];
}

export interface ActionNode extends TreeNode {
  type: "action";
  children: never[];
}
