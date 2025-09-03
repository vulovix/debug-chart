import { useState, useMemo, useCallback } from "react";
import "./App.css";
import { testData } from "./data/testData";
import { TreeOrganizer } from "./utils/TreeOrganizer";
import { TimelineOrganizer } from "./utils/TimelineOrganizer";
import { TreeView } from "./components/TreeView";
import { TreeStats } from "./components/TreeStats";
import { TimelineView } from "./components/TimelineView";
import { TimelineStats } from "./components/TimelineStats";
import type { TreeNode } from "./types/TreeItem";
import type { TimelineNode } from "./types/TimelineItem";

type ViewMode = "tree" | "timeline";

function App() {
  const [expandedNodes, setExpandedNodes] = useState<Set<number | string>>(new Set());
  const [timelineExpandedNodes, setTimelineExpandedNodes] = useState<Set<number | string>>(new Set());
  const [viewMode, setViewMode] = useState<ViewMode>("tree");

  // Organize the test data into a tree structure
  const treeData = useMemo(() => {
    const organizer = new TreeOrganizer(testData);
    const tree = organizer.organizeIntoTree();

    // Update expanded state for tree nodes
    const updateExpandedState = (nodes: TreeNode[]): TreeNode[] => {
      return nodes.map((node) => ({
        ...node,
        isExpanded: expandedNodes.has(node.id),
        children: updateExpandedState(node.children),
      }));
    };

    return updateExpandedState(tree);
  }, [expandedNodes]);

  const treeStats = useMemo(() => {
    const organizer = new TreeOrganizer(testData);
    const tree = organizer.organizeIntoTree();
    return organizer.getStats(tree);
  }, []);

  // Organize the timeline data into 5-second windows
  const timelineData = useMemo(() => {
    const timelineOrganizer = new TimelineOrganizer(testData, 5); // 5-second windows
    const timelineTree = timelineOrganizer.organizeIntoTimelineTree();

    // Update expanded state for timeline nodes
    const updateExpandedState = (nodes: TimelineNode[]): TimelineNode[] => {
      return nodes.map((node) => ({
        ...node,
        isExpanded: timelineExpandedNodes.has(node.id),
        children: updateExpandedState(node.children),
      }));
    };

    return updateExpandedState(timelineTree);
  }, [timelineExpandedNodes]);

  const timelineStats = useMemo(() => {
    const timelineOrganizer = new TimelineOrganizer(testData, 5);
    const windows = timelineOrganizer.organizeIntoTimeline();
    return timelineOrganizer.getTimelineStats(windows);
  }, []);

  const handleToggle = useCallback((nodeId: number | string) => {
    setExpandedNodes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  }, []);

  const handleTimelineToggle = useCallback((nodeId: number | string) => {
    setTimelineExpandedNodes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  }, []);

  const expandAll = () => {
    if (viewMode === "tree") {
      const getAllNodeIds = (nodes: TreeNode[]): (number | string)[] => {
        const ids: (number | string)[] = [];
        for (const node of nodes) {
          ids.push(node.id);
          if (node.children.length > 0) {
            ids.push(...getAllNodeIds(node.children));
          }
        }
        return ids;
      };

      const allIds = getAllNodeIds(treeData);
      setExpandedNodes(new Set(allIds));
    } else {
      const getAllNodeIds = (nodes: TimelineNode[]): (number | string)[] => {
        const ids: (number | string)[] = [];
        for (const node of nodes) {
          ids.push(node.id);
          if (node.children.length > 0) {
            ids.push(...getAllNodeIds(node.children));
          }
        }
        return ids;
      };

      const allIds = getAllNodeIds(timelineData);
      setTimelineExpandedNodes(new Set(allIds));
    }
  };

  const collapseAll = () => {
    if (viewMode === "tree") {
      setExpandedNodes(new Set());
    } else {
      setTimelineExpandedNodes(new Set());
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>📁 Tree Structure Organizer</h1>
        <p>Visual organization of {testData.length.toLocaleString()} test items</p>
      </header>

      <div className="view-selector">
        <button onClick={() => setViewMode("tree")} className={`view-button ${viewMode === "tree" ? "active" : ""}`}>
          🌳 Hierarchical Tree
        </button>
        <button onClick={() => setViewMode("timeline")} className={`view-button ${viewMode === "timeline" ? "active" : ""}`}>
          ⏰ Timeline (5s Windows)
        </button>
      </div>

      {viewMode === "tree" ? (
        <>
          <TreeStats stats={treeStats} />

          <div className="controls">
            <button onClick={expandAll} className="control-button expand">
              📂 Expand All
            </button>
            <button onClick={collapseAll} className="control-button collapse">
              📁 Collapse All
            </button>
            <div className="data-info">Hierarchical view of {testData.length.toLocaleString()} items</div>
          </div>

          <div className="tree-container">
            <TreeView tree={treeData} onToggle={handleToggle} />
          </div>
        </>
      ) : (
        <>
          <TimelineStats stats={timelineStats} />

          <div className="controls">
            <button onClick={expandAll} className="control-button expand">
              📂 Expand All Windows
            </button>
            <button onClick={collapseAll} className="control-button collapse">
              📁 Collapse All Windows
            </button>
            <div className="data-info">Timeline view with 5-second activity windows</div>
          </div>

          <div className="tree-container">
            <TimelineView timeline={timelineData} onToggle={handleTimelineToggle} />
          </div>
        </>
      )}
    </div>
  );
}

export default App;
