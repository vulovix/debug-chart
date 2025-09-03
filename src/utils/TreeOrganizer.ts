import type { BaseItem, TreeNode, TabNode, PageNode, LeftNode, WidgetNode, ActionNode } from "../types/TreeItem";

export class TreeOrganizer {
  private items: BaseItem[];

  constructor(items: BaseItem[]) {
    this.items = items;
  }

  public organizeIntoTree(): TreeNode[] {
    // Group items by tabId first
    const tabGroups = this.groupByTab();
    const trees: TreeNode[] = [];

    for (const [tabId, tabItems] of tabGroups) {
      const tabNode = this.createTabNode(tabId, tabItems);
      trees.push(tabNode);
    }

    return trees.sort((a, b) => parseInt(a.label.replace("Tab ", "")) - parseInt(b.label.replace("Tab ", "")));
  }

  private groupByTab(): Map<number, BaseItem[]> {
    const groups = new Map<number, BaseItem[]>();

    for (const item of this.items) {
      if (!groups.has(item.tabId)) {
        groups.set(item.tabId, []);
      }
      groups.get(item.tabId)!.push(item);
    }

    return groups;
  }

  private createTabNode(tabId: number, items: BaseItem[]): TabNode {
    const tabNode: TabNode = {
      id: tabId * 1000000, // Ensure unique ID
      type: "tab",
      label: `Tab ${tabId}`,
      data: {
        id: tabId * 1000000,
        userId: 0,
        property: `tab_${tabId}`,
        parentId: null,
        scope: null,
        tabId,
        date: new Date().toISOString().split("T")[0],
      },
      children: [],
      isExpanded: false,
    };

    // Get root level items (parentId is null)
    const rootItems = items.filter((item) => item.parentId === null);

    for (const item of rootItems) {
      if (item.scope === "page") {
        const pageNode = this.createPageNode(item, items);
        tabNode.children.push(pageNode);
      } else if (item.scope === "left") {
        const leftNode = this.createLeftNode(item, items);
        tabNode.children.push(leftNode);
      } else {
        // Root level action
        const actionNode = this.createActionNode(item);
        tabNode.children.push(actionNode);
      }
    }

    return tabNode;
  }

  private createPageNode(pageItem: BaseItem, allItems: BaseItem[]): PageNode {
    const pageNode: PageNode = {
      id: pageItem.id,
      type: "page",
      label: `📄 ${pageItem.property}`,
      data: pageItem,
      children: [],
      isExpanded: false,
    };

    const children = allItems.filter((item) => item.parentId === pageItem.id);

    for (const child of children) {
      if (child.scope === "widget") {
        const widgetNode = this.createWidgetNode(child, allItems);
        pageNode.children.push(widgetNode);
      } else {
        const actionNode = this.createActionNode(child);
        pageNode.children.push(actionNode);
      }
    }

    return pageNode;
  }

  private createLeftNode(leftItem: BaseItem, allItems: BaseItem[]): LeftNode {
    const leftNode: LeftNode = {
      id: leftItem.id,
      type: "left",
      label: `⬅️ ${leftItem.property}`,
      data: leftItem,
      children: [],
      isExpanded: false,
    };

    const children = allItems.filter((item) => item.parentId === leftItem.id);

    for (const child of children) {
      if (child.scope === "widget") {
        const widgetNode = this.createWidgetNode(child, allItems);
        leftNode.children.push(widgetNode);
      } else {
        const actionNode = this.createActionNode(child);
        leftNode.children.push(actionNode);
      }
    }

    return leftNode;
  }

  private createWidgetNode(widgetItem: BaseItem, allItems: BaseItem[]): WidgetNode {
    const widgetNode: WidgetNode = {
      id: widgetItem.id,
      type: "widget",
      label: `🔧 ${widgetItem.property}`,
      data: widgetItem,
      children: [],
      isExpanded: false,
    };

    const actions = allItems.filter((item) => item.parentId === widgetItem.id);

    for (const action of actions) {
      const actionNode = this.createActionNode(action);
      widgetNode.children.push(actionNode);
    }

    return widgetNode;
  }

  private createActionNode(actionItem: BaseItem): ActionNode {
    return {
      id: actionItem.id,
      type: "action",
      label: `⚡ ${actionItem.property}`,
      data: actionItem,
      children: [],
      isExpanded: false,
    };
  }

  public getStats(tree: TreeNode[]): {
    totalTabs: number;
    totalPages: number;
    totalLefts: number;
    totalWidgets: number;
    totalActions: number;
    totalItems: number;
  } {
    let totalTabs = 0;
    let totalPages = 0;
    let totalLefts = 0;
    let totalWidgets = 0;
    let totalActions = 0;
    let totalItems = 0;

    const countNodes = (nodes: TreeNode[]) => {
      for (const node of nodes) {
        totalItems++;
        switch (node.type) {
          case "tab":
            totalTabs++;
            break;
          case "page":
            totalPages++;
            break;
          case "left":
            totalLefts++;
            break;
          case "widget":
            totalWidgets++;
            break;
          case "action":
            totalActions++;
            break;
        }

        if (node.children.length > 0) {
          countNodes(node.children);
        }
      }
    };

    countNodes(tree);

    return {
      totalTabs,
      totalPages,
      totalLefts,
      totalWidgets,
      totalActions,
      totalItems,
    };
  }
}
