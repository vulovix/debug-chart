import React from "react";
import type { GroupedEvents } from "./utils";
import { getEventsNearTime, formatPreciseTime, getEventHierarchyPath } from "./utils";
import "./TimelineTooltip.css";

interface TimelineTooltipProps {
  cursorTime: Date;
  groupedEvents: GroupedEvents;
  isSticky?: boolean;
  onClose?: () => void;
}

const TimelineTooltip: React.FC<TimelineTooltipProps> = ({ cursorTime, groupedEvents, isSticky = false, onClose }) => {
  // Get events near cursor time for each tab
  const eventsByTab = Object.entries(groupedEvents)
    .map(([tabId, events]) => {
      const nearEvents = getEventsNearTime(events, cursorTime, 1000);
      return {
        tabId: parseInt(tabId),
        events: nearEvents,
      };
    })
    .filter((tab) => tab.events.length > 0);

  const totalEvents = eventsByTab.reduce((sum, tab) => sum + tab.events.length, 0);

  if (totalEvents === 0) {
    return (
      <div className={`timeline-tooltip ${isSticky ? "sticky" : ""}`}>
        <div className="tooltip-header">
          <span className="tooltip-time">{formatPreciseTime(cursorTime)}</span>
          <span className="tooltip-count">No events within 1s</span>
        </div>
        <div className="tooltip-content">
          <div className="no-events">No events found near this timestamp</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`timeline-tooltip ${isSticky ? "sticky" : ""}`}>
      <div className="tooltip-header">
        <span className="tooltip-time">{formatPreciseTime(cursorTime)}</span>
        <span className="tooltip-count">
          {totalEvents} event{totalEvents !== 1 ? "s" : ""} in {eventsByTab.length} tab{eventsByTab.length !== 1 ? "s" : ""}
        </span>
        {isSticky && onClose && (
          <button className="tooltip-close" onClick={onClose} title="Close tooltip">
            ✕
          </button>
        )}
      </div>

      <div className="tooltip-content">
        {eventsByTab.map(({ tabId, events }) => (
          <div key={tabId} className="tab-section">
            <div className="tab-header">
              <span className="tab-badge">Tab {tabId}</span>
              <span className="event-count">({events.length})</span>
            </div>

            <div className="events-list">
              {events.map((event) => (
                <div key={event.id} className={`event-item event-${event.scope || "action"}`}>
                  <div className="event-time">{formatPreciseTime(new Date(event.date))}</div>
                  <div className="event-details">
                    <div className="event-description">
                      <strong>{event.action || event.property}</strong> executed by <em>User {event.userId}</em>
                      {event.scope && <span className="scope-info"> in {event.scope} context</span>}
                    </div>
                    <div className="event-hierarchy">{getEventHierarchyPath(event)}</div>
                    <div className="event-meta">
                      <span className="event-id">ID: {event.id}</span>
                      {event.parentId && <span className="event-parent">Parent: {event.parentId}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TimelineTooltip;
