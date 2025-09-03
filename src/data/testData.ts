import type { BaseItem } from "../types/TreeItem";

const properties = [
  "loadSettings",
  "loadData",
  "saveUser",
  "updateProfile",
  "deleteItem",
  "createWidget",
  "renderChart",
  "processPayment",
  "sendEmail",
  "validateForm",
  "exportData",
  "importFile",
  "compressImage",
  "generateReport",
  "syncData",
];
const scopes = ["page", "left", "widget"];

function getRandomDate(): string {
  // Create a more realistic timeline with activities spread across different times
  const now = new Date();
  const daysBack = Math.floor(Math.random() * 30); // Last 30 days
  const hoursBack = Math.floor(Math.random() * 24); // Random hour
  const minutesBack = Math.floor(Math.random() * 60); // Random minute

  const date = new Date(now);
  date.setDate(date.getDate() - daysBack);
  date.setHours(date.getHours() - hoursBack);
  date.setMinutes(date.getMinutes() - minutesBack);
  date.setSeconds(0);
  date.setMilliseconds(0);

  return date.toISOString().replace("T", " ").substring(0, 19); // YYYY-MM-DD HH:MM:SS format
}

function getRandomProperty(): string {
  return properties[Math.floor(Math.random() * properties.length)];
}

function getRandomScope(): "page" | "left" | "widget" | null {
  const includeNull = Math.random() < 0.3; // 30% chance of null scope
  if (includeNull) return null;
  return scopes[Math.floor(Math.random() * scopes.length)] as "page" | "left" | "widget";
}

export function generateTestData(count: number = 1000): BaseItem[] {
  const items: BaseItem[] = [];
  let currentId = 1;

  // Generate tabs (10-15 tabs)
  const tabCount = Math.floor(Math.random() * 6) + 10;
  const tabIds: number[] = [];

  for (let i = 1; i <= tabCount; i++) {
    tabIds.push(i);
  }

  // Track parent items for hierarchy
  const pageItems: BaseItem[] = [];
  const leftItems: BaseItem[] = [];
  const widgetItems: BaseItem[] = [];

  while (items.length < count) {
    const tabId = tabIds[Math.floor(Math.random() * tabIds.length)];
    const userId = Math.floor(Math.random() * 50) + 1;

    // Decide what type of item to create based on current hierarchy needs
    const rand = Math.random();

    if (rand < 0.15) {
      // Create page container (15% chance)
      const item: BaseItem = {
        id: currentId++,
        userId,
        property: `page_${getRandomProperty()}`,
        parentId: null,
        scope: "page",
        tabId,
        date: getRandomDate(),
      };
      items.push(item);
      pageItems.push(item);
    } else if (rand < 0.3) {
      // Create left container (15% chance)
      const item: BaseItem = {
        id: currentId++,
        userId,
        property: `left_${getRandomProperty()}`,
        parentId: null,
        scope: "left",
        tabId,
        date: getRandomDate(),
      };
      items.push(item);
      leftItems.push(item);
    } else if (rand < 0.65) {
      // Create widget (35% chance)
      let parentId: number | null = null;

      // 70% chance to attach to a page or left container
      if (Math.random() < 0.7) {
        const containers = [...pageItems, ...leftItems].filter((item) => item.tabId === tabId);
        if (containers.length > 0) {
          parentId = containers[Math.floor(Math.random() * containers.length)].id;
        }
      }

      const item: BaseItem = {
        id: currentId++,
        userId,
        property: `widget_${getRandomProperty()}`,
        parentId,
        scope: "widget",
        tabId,
        date: getRandomDate(),
      };
      items.push(item);
      widgetItems.push(item);
    } else {
      // Create action (35% chance)
      let parentId: number | null = null;
      let scope: "page" | "left" | "widget" | null = null;

      // 80% chance to attach to some parent
      if (Math.random() < 0.8) {
        const allContainers = [...pageItems, ...leftItems, ...widgetItems].filter((item) => item.tabId === tabId);
        if (allContainers.length > 0) {
          const parent = allContainers[Math.floor(Math.random() * allContainers.length)];
          parentId = parent.id;
          scope = parent.scope;
        }
      }

      const item: BaseItem = {
        id: currentId++,
        userId,
        property: getRandomProperty(),
        parentId,
        scope: scope || getRandomScope(),
        tabId,
        date: getRandomDate(),
      };
      items.push(item);
    }
  }

  return items.slice(0, count);
}

// Generate the actual test data
export const testData = generateTestData(1000);
