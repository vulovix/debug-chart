import React, { useState, useMemo, useRef } from "react";
import type { Event } from "./types";
import { processEvents, getEventsAtTime, getNestedJSON } from "./utils";
import "./TimelineDebugger.css";

interface TimelineDebuggerProps {
  events: Event[];
}

const TimelineDebugger: React.FC<TimelineDebuggerProps> = ({ events }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [scrubberTime, setScrubberTime] = useState<Date | null>(null);
  const [frozen, setFrozen] = useState(false);
  const [tooltipEvents, setTooltipEvents] = useState<Event[]>([]);

  const processed = useMemo(() => processEvents(events), [events]);
  const { spans, tabs, minTime, maxTime } = processed;

  // Output nested JSON structure for debugging/analysis
  useMemo(() => {
    const nestedJSON = getNestedJSON(processed);
    console.log("Nested JSON Structure:", JSON.stringify(nestedJSON, null, 2));
  }, [processed]);

  const totalDuration = maxTime.getTime() - minTime.getTime();
  const svgWidth = 1200;
  const laneHeight = 100;
  const totalHeight = tabs.length * laneHeight;

  const getX = (time: Date) => ((time.getTime() - minTime.getTime()) / totalDuration) * svgWidth;

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (frozen) return;
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const time = new Date(minTime.getTime() + (x / svgWidth) * totalDuration);
    setScrubberTime(time);
    const eventsAtTime = getEventsAtTime(events, time);
    setTooltipEvents(eventsAtTime);
  };

  const handleExportJSON = () => {
    const nestedJSON = getNestedJSON(processed);
    const blob = new Blob([JSON.stringify(nestedJSON, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'timeline-debugger-data.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClick = () => {
    setFrozen(!frozen);
  };

  return (
    <div className="timeline-debugger">
      <div className="controls">
        <button onClick={handleExportJSON} className="export-button">Export JSON</button>
      </div>
      <svg ref={svgRef} width={svgWidth} height={totalHeight} onMouseMove={handleMouseMove} onClick={handleClick} className="timeline-svg">
        {/* Background spans */}
        {spans.map((span, i) => (
          <g key={i}>
            <rect
              x={getX(span.start)}
              y={0}
              width={getX(span.end) - getX(span.start)}
              height={totalHeight}
              fill="rgba(255,255,255,0.05)"
              stroke="rgba(255,255,255,0.1)"
            />
            <text x={getX(span.start) + (getX(span.end) - getX(span.start)) / 2} y={-10} textAnchor="middle" className="span-label">
              {span.start.toISOString().slice(11, 19)} - {span.end.toISOString().slice(11, 19)}
            </text>
          </g>
        ))}

        {/* Lanes */}
        {tabs.map((tab, tabIndex) => (
          <g key={tab.tabId}>
            <text x={10} y={tabIndex * laneHeight + 15} className="lane-label">
              Tab {tab.tabId}
            </text>
            <line x1={0} y1={tabIndex * laneHeight + laneHeight / 2} x2={svgWidth} y2={tabIndex * laneHeight + laneHeight / 2} stroke="rgba(255,255,255,0.2)" />
            
            {/* Top level events */}
            {tab.events.map((event) => (
              <circle
                key={event.id}
                cx={getX(new Date(event.date))}
                cy={tabIndex * laneHeight + laneHeight / 2}
                r={4}
                fill="lightblue"
                className="event-marker"
              />
            ))}
            
            {/* Containers */}
            {tab.containers.map((container, cIndex) => (
              <g key={container.scope}>
                <text x={10} y={tabIndex * laneHeight + 30 + cIndex * 25} className="container-label">
                  {container.scope.charAt(0).toUpperCase() + container.scope.slice(1)}
                </text>
                <line x1={0} y1={tabIndex * laneHeight + 35 + cIndex * 25} x2={svgWidth} y2={tabIndex * laneHeight + 35 + cIndex * 25} stroke="rgba(255,255,255,0.1)" />
                
                {container.events.map((event) => (
                  <circle
                    key={event.id}
                    cx={getX(new Date(event.date))}
                    cy={tabIndex * laneHeight + 35 + cIndex * 25}
                    r={3}
                    fill="lightgreen"
                    className="event-marker"
                  />
                ))}
                
                {/* Widgets */}
                {container.widgets.map((widget, wIndex) => (
                  <g key={widget.id}>
                    <text x={10} y={tabIndex * laneHeight + 50 + cIndex * 25 + wIndex * 15} className="widget-label">
                      Widget {widget.id}
                    </text>
                    <line x1={0} y1={tabIndex * laneHeight + 55 + cIndex * 25 + wIndex * 15} x2={svgWidth} y2={tabIndex * laneHeight + 55 + cIndex * 25 + wIndex * 15} stroke="rgba(255,255,255,0.05)" />
                    
                    {widget.events.map((event) => (
                      <circle
                        key={event.id}
                        cx={getX(new Date(event.date))}
                        cy={tabIndex * laneHeight + 55 + cIndex * 25 + wIndex * 15}
                        r={2}
                        fill="yellow"
                        className="event-marker"
                      />
                    ))}
                  </g>
                ))}
              </g>
            ))}
          </g>
        ))}

        {/* Scrubber line */}
        {scrubberTime && (
          <line x1={getX(scrubberTime)} y1={0} x2={getX(scrubberTime)} y2={totalHeight} stroke="red" strokeWidth={2} className="scrubber-line" />
        )}
      </svg>

      {/* Tooltip */}
      {frozen && tooltipEvents.length > 0 && (
        <div className="tooltip">
          <h4>{scrubberTime?.toISOString().slice(11, 23)}</h4>
          <ul>
            {tooltipEvents.map((event) => {
              let hierarchy = `Tab ${event.tabId}`;
              if (event.scope) {
                if (event.scope === 'widget') {
                  hierarchy += ` → Widget ${event.id}`;
                } else {
                  hierarchy += ` → ${event.scope.charAt(0).toUpperCase() + event.scope.slice(1)}`;
                }
              }
              if (event.action) {
                hierarchy += ` → ${event.action}`;
              } else {
                hierarchy += ` → ${event.property}`;
              }
              return (
                <li key={event.id}>
                  {hierarchy}
                </li>
              );
            })}
          </ul>
          <button onClick={() => setFrozen(false)}>Dismiss</button>
        </div>
      )}
    </div>
  );
};

export default TimelineDebugger;
