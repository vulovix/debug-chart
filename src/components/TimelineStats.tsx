import React from "react";
import "./TimelineStats.css";

interface TimelineStatsProps {
  stats: {
    totalWindows: number;
    totalItems: number;
    averageItemsPerWindow: number;
    busiestWindow: string;
    maxItemsInWindow: number;
    timeSpan: string;
    windowSize: string;
  };
}

export const TimelineStats: React.FC<TimelineStatsProps> = ({ stats }) => {
  return (
    <div className="timeline-stats">
      <h3 className="timeline-stats-title">⏰ 5-Second Timeline Analysis</h3>

      <div className="timeline-overview-section">
        <div className="overview-item">
          <span className="overview-label">Time Span:</span>
          <span className="overview-value">{stats.timeSpan}</span>
        </div>
        <div className="overview-item">
          <span className="overview-label">Window Size:</span>
          <span className="overview-value">{stats.windowSize}</span>
        </div>
      </div>

      <div className="timeline-stats-grid">
        <div className="timeline-stat-card primary">
          <div className="stat-icon">⏰</div>
          <div className="stat-content">
            <div className="stat-value">{stats.totalWindows.toLocaleString()}</div>
            <div className="stat-label">Time Windows</div>
            <div className="stat-description">5-second intervals</div>
          </div>
        </div>

        <div className="timeline-stat-card">
          <div className="stat-icon">⚡</div>
          <div className="stat-content">
            <div className="stat-value">{stats.totalItems.toLocaleString()}</div>
            <div className="stat-label">Total Activities</div>
            <div className="stat-description">All recorded actions</div>
          </div>
        </div>

        <div className="timeline-stat-card">
          <div className="stat-icon">�</div>
          <div className="stat-content">
            <div className="stat-value">{stats.averageItemsPerWindow}</div>
            <div className="stat-label">Avg per Window</div>
            <div className="stat-description">Activities per 5s</div>
          </div>
        </div>

        <div className="timeline-stat-card peak">
          <div className="stat-icon">🔥</div>
          <div className="stat-content">
            <div className="stat-value">{stats.maxItemsInWindow}</div>
            <div className="stat-label">Peak Activity</div>
            <div className="stat-description">Max in single window</div>
          </div>
        </div>
      </div>

      {stats.busiestWindow !== "N/A" && (
        <div className="busiest-window-section">
          <div className="busiest-window-header">
            <span className="peak-icon">🎯</span>
            <span className="peak-title">Peak Activity Window</span>
          </div>
          <div className="busiest-window-details">
            <div className="window-time">{stats.busiestWindow}</div>
            <div className="window-activity">{stats.maxItemsInWindow} activities in 5 seconds</div>
          </div>
        </div>
      )}
    </div>
  );
};
