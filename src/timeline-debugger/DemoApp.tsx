import React from "react";
import TimelineDebugger from "./TimelineDebugger";
import { sampleEvents } from "./sampleData";

const App: React.FC = () => {
  return (
    <div>
      <h1>Interactive Event Timeline Debugger</h1>
      <TimelineDebugger events={sampleEvents} />
    </div>
  );
};

export default App;
