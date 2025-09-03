# debugger-one

A performant, dark-themed timeline debugger component for React.

Features

- Stacked lanes per tab
- SVG-based rendering for performance
- Vertical scrubber line that follows cursor and can be frozen
- Sticky, scrollable tooltip showing stacked events within ±50ms
- 5-second spans with from/to labels (data structure output)

Usage

Import and render in your app:

```tsx
import { TimelineDebugger } from "./debugger-one";
import { sampleEvents, makeEvents } from "./debugger-one/sampleData";

// use sampleEvents or makeEvents(1200)
<TimelineDebugger events={[...sampleEvents, ...makeEvents(1200)]} />;
```

Notes on performance

- Uses SVG for thousands of dots; if you need millions, consider canvas layer.
- Data is grouped into 5-second spans via `buildSpans` for quick aggregation.

\*\*\* End Patch
