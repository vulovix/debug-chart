# Debugger Two

A high-performance, interactive timeline debugger for event data visualization.

## Features

- **Hierarchical Visualization**: Displays events in a tab → container → widget → action structure.
- **Interactive Scrubber**: Hover to inspect events near the cursor, click to freeze the view.
- **Dark Theme**: Minimalistic design with dark background for better readability.
- **5-Second Spans**: Optionally group events into 5-second intervals with from-to timestamps.
- **Performance Optimized**: Handles 1000+ events efficiently using SVG and memoization.
- **Tooltip Panel**: Sticky tooltip showing exact timestamps and full event hierarchy.

## Usage

```tsx
import { TimelineDebugger, sampleEvents } from "./debugger-two";

function App() {
  return <TimelineDebugger events={sampleEvents} showSpans={true} />;
}
```

## Event Data Structure

Events must conform to:

```typescript
type TimelineEvent = {
  id: number;
  userId?: number;
  property?: string;
  parentId?: number | null;
  scope?: null | "page" | "left" | "widget";
  tabId: number;
  action?: string;
  date: string; // ISO string
};
```

## Props

- `events`: Array of `TimelineEvent`
- `height?`: Container height (default: 400)
- `showSpans?`: Whether to display 5-second spans (default: false)

## Output

The component provides a nested JSON structure for 5-second spans via the `buildSpans` utility:

```typescript
const spans = buildSpans(events);
// Each span: { from: ISO, to: ISO, events: [...], hierarchy: {...} }
```
