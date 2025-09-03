import React from "react";
import type { TreeNode } from "../types/TreeItem";
import "./TreeView.css";

interface TreeViewProps {
  tree: TreeNode[];
  onToggle: (nodeId: number) => void;
}

interface TreeNodeProps {
  node: TreeNode;
  level: number;
  onToggle: (nodeId: number) => void;
}

const TreeNodeComponent: React.FC<TreeNodeProps> = ({ node, level, onToggle }) => {
  const hasChildren = node.children.length > 0;
  const isExpanded = node.isExpanded || false;

  const getNodeIcon = (type: string, isExpanded: boolean, hasChildren: boolean) => {
    switch (type) {
      case "tab":
        return isExpanded ? "📂" : "📁";
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

  const getNodeTypeClass = (type: string) => {
    return `tree-node-${type}`;
  };

  return (
    <div className="tree-node-container">
      <div
        className={`tree-node ${getNodeTypeClass(node.type)}`}
        style={{ paddingLeft: `${level * 20 + 8}px` }}
        onClick={() => hasChildren && onToggle(node.id)}
      >
        {getExpandIcon()}
        <span className="node-icon">{getNodeIcon(node.type, isExpanded, hasChildren)}</span>
        <span className="node-label">{node.label}</span>
        <span className="node-meta">
          {node.data.userId && <span className="user-id">User: {node.data.userId}</span>}
          <span className="item-id">ID: {node.data.id}</span>
        </span>
      </div>

      {isExpanded && hasChildren && (
        <div className="tree-children">
          {node.children.map((child) => (
            <TreeNodeComponent key={child.id} node={child} level={level + 1} onToggle={onToggle} />
          ))}
        </div>
      )}
    </div>
  );
};

export const TreeView: React.FC<TreeViewProps> = ({ tree, onToggle }) => {
  return (
    <div className="tree-view">
      {tree.map((rootNode) => (
        <TreeNodeComponent key={rootNode.id} node={rootNode} level={0} onToggle={onToggle} />
      ))}
    </div>
  );
};
