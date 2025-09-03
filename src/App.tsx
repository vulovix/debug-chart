import { TimelineDebugger } from "./debugger-two";
import { sampleEvents, makeEvents } from "./debugger-two/sampleData";

function App() {
  const many = makeEvents(1200);
  const events = [...sampleEvents, ...many];

  return (
    <div style={{ background: "#071019", minHeight: "100vh" }}>
      <TimelineDebugger events={events} />
    </div>
  );
}

export default App;
