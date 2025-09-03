import React from "react";
import type { TimelineNode } from "../types/TimelineItem";
import "./TimelineView.css";

interface TimelineViewProps {
  timeline: TimelineNode[];
  onToggle: (nodeId: string | number) => void;
}

interface TimelineNodeProps {
  node: TimelineNode;
  level: number;
  onToggle: (nodeId: string | number) => void;
}

const TimelineNodeComponent: React.FC<TimelineNodeProps> = ({ node, level, onToggle }) => {
  const hasChildren = node.children.length > 0;
  const isExpanded = node.isExpanded || false;

  const getActivityIcon = (activityType?: string, nodeType?: string, isExpanded?: boolean, hasChildren?: boolean) => {
    const type = activityType || nodeType;
    switch (type) {
      case "timeWindow":
        return "⏰";
      case "timestamp":
        return isExpanded ? "🕒" : "⏰";
      case "tab":
        return hasChildren ? (isExpanded ? "📂" : "📁") : "📄";
      case "container":
        return node.data?.scope === "page" ? "📄" : "⬅️";
      case "page":
        return hasChildren ? (isExpanded ? "📂" : "📁") : "📄";
      case "left":
        return hasChildren ? (isExpanded ? "📂" : "📁") : "⬅️";
      case "widget":
        return hasChildren ? (isExpanded ? "📂" : "📁") : "🔧";
      case "action":
        return "⚡";
      default:
        return "📄";
    }
  };

  const getExpandIcon = () => {
    if (!hasChildren) return <span className="expand-icon-placeholder"></span>;
    return <span className="expand-icon">{isExpanded ? "▼" : "▶"}</span>;
  };

  const getActivityTypeClass = (activityType?: string, nodeType?: string) => {
    const type = activityType || nodeType || "default";
    return `timeline-node-${type}`;
  };

  const getNodeDetails = () => {
    const activityType = node.activityType || node.type;
    switch (activityType) {
      case "timeWindow":
        return (
          <span className="node-details">
            <span className="activity-count">{node.activityCount || 0} items</span>
            {node.timeWindow && <span className="time-window">{node.timeWindow}</span>}
            {node.startTime && node.endTime && (
              <span className="window-duration">{Math.round((new Date(node.endTime).getTime() - new Date(node.startTime).getTime()) / 1000)}s</span>
            )}
          </span>
        );
      case "tab":
        return (
          <span className="node-details">
            <span className="tab-id">Tab {node.data?.tabId || "N/A"}</span>
            <span className="activity-count">{node.activityCount || 0} events</span>
          </span>
        );
      case "container":
      case "page":
      case "left":
        return (
          <span className="node-details">
            <span className="scope-badge">{node.data?.scope || node.type}</span>
            {node.exactTimestamp && <span className="exact-timestamp">{node.exactTimestamp}</span>}
            {node.data?.userId && <span className="user-id">User: {node.data.userId}</span>}
          </span>
        );
      case "widget":
        return (
          <span className="node-details">
            <span className="scope-badge">widget</span>
            {node.exactTimestamp && <span className="exact-timestamp">{node.exactTimestamp}</span>}
            {node.data?.userId && <span className="user-id">User: {node.data.userId}</span>}
          </span>
        );
      case "action":
        return (
          <span className="node-details">
            <span className="scope-badge">action</span>
            {node.exactTimestamp && <span className="exact-timestamp">{node.exactTimestamp}</span>}
            {node.data?.userId && <span className="user-id">User: {node.data.userId}</span>}
            <span className="item-id">#{node.data?.id || "N/A"}</span>
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="timeline-node-container">
      <div
        className={`timeline-node ${getActivityTypeClass(node.activityType, node.type)}`}
        style={{ paddingLeft: `${level * 20 + 8}px` }}
        onClick={() => hasChildren && onToggle(node.id)}
      >
        {getExpandIcon()}
        <span className="node-icon">{getActivityIcon(node.activityType, node.type, isExpanded, hasChildren)}</span>
        <span className="node-label">{node.label}</span>
        {getNodeDetails()}
      </div>

      {isExpanded && hasChildren && (
        <div className="timeline-children">
          {node.children.map((child) => (
            <TimelineNodeComponent key={child.id} node={child} level={level + 1} onToggle={onToggle} />
          ))}
        </div>
      )}
    </div>
  );
};

export const TimelineView: React.FC<TimelineViewProps> = ({ timeline, onToggle }) => {
  if (timeline.length === 0) {
    return (
      <div className="timeline-view-empty">
        <p>No timeline data available</p>
      </div>
    );
  }

  return (
    <div className="timeline-view">
      <div className="timeline-header">
        <h3>⏰ Timeline View (5-Second Windows)</h3>
        <p>Navigate through 5-second time windows to see bursts of activity</p>
      </div>
      <div className="timeline-content">
        {timeline.map((windowNode) => (
          <TimelineNodeComponent key={windowNode.id} node={windowNode} level={0} onToggle={onToggle} />
        ))}
      </div>
    </div>
  );
};
