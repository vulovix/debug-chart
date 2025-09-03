import React from "react";
import "./TreeStats.css";

interface TreeStatsProps {
  stats: {
    totalTabs: number;
    totalPages: number;
    totalLefts: number;
    totalWidgets: number;
    totalActions: number;
    totalItems: number;
  };
}

export const TreeStats: React.FC<TreeStatsProps> = ({ stats }) => {
  const statItems = [
    { label: "Tabs", value: stats.totalTabs, icon: "📁", color: "#569cd6" },
    { label: "Pages", value: stats.totalPages, icon: "📄", color: "#dcdcaa" },
    { label: "Left Containers", value: stats.totalLefts, icon: "⬅️", color: "#4ec9b0" },
    { label: "Widgets", value: stats.totalWidgets, icon: "🔧", color: "#c586c0" },
    { label: "Actions", value: stats.totalActions, icon: "⚡", color: "#9cdcfe" },
  ];

  return (
    <div className="tree-stats">
      <h3 className="stats-title">Tree Structure Overview</h3>
      <div className="stats-grid">
        {statItems.map((item) => (
          <div key={item.label} className="stat-item" style={{ borderColor: item.color }}>
            <div className="stat-icon">{item.icon}</div>
            <div className="stat-content">
              <div className="stat-value" style={{ color: item.color }}>
                {item.value.toLocaleString()}
              </div>
              <div className="stat-label">{item.label}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="total-items">
        <strong>Total Items: {stats.totalItems.toLocaleString()}</strong>
      </div>
    </div>
  );
};
