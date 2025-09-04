import { TimelineDebuggerFeature } from "./features/TimelineDebuggerFeature";
import { sampleEvents, makeEvents } from "./features/TimelineDebuggerFeature/sampleData";

function App() {
  const many = makeEvents(1200);
  const events = [...sampleEvents, ...many];

  return (
    <div style={{ background: "#071019", minHeight: "100vh" }}>
      <TimelineDebuggerFeature events={events} />
    </div>
  );
}

export default App;
