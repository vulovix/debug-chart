import type { TimelineEvent, Span } from "../../types";
import { formatTimeIso, getDotColor } from "../../utils";
import { PIXELS_PER_SECOND } from "../../constants";

type TooltipPanelProps = {
  activeX: number | null;
  startTime: number;
  currentSpan: Span | null;
  eventsNear: TimelineEvent[];
  isFrozen: boolean;
  toleranceMs: number;
};

export function TooltipPanel({ activeX, startTime, currentSpan, eventsNear, isFrozen, toleranceMs }: TooltipPanelProps) {
  return (
    <div className="dbg2-tooltip-panel">
      {activeX == null ? (
        <div className="dbg2-tooltip-empty">Hover timeline to inspect events</div>
      ) : (
        <div className="dbg2-tooltip">
          <div className="dbg2-tooltip-time">{activeX != null ? formatTimeIso(new Date(startTime + Math.round(activeX / PIXELS_PER_SECOND) * 1000).toISOString()) : "—"}</div>
          {currentSpan && (
            <div className="dbg2-tooltip-span">
              Span: {formatTimeIso(currentSpan.from)} - {formatTimeIso(currentSpan.to)}
            </div>
          )}
          <div className="dbg2-tooltip-list">
            {eventsNear.length === 0 ? (
              <div className="dbg2-tooltip-none">No events within ±{toleranceMs}ms</div>
            ) : (
              eventsNear.map((ev) => {
                const color = getDotColor(ev.scope);
                return (
                  <div key={ev.id} className="dbg2-tooltip-item">
                    <div className="dbg2-tooltip-item-main">
                      <span className="dbg2-tooltip-scope-dot" style={{ backgroundColor: color }}></span>
                      Tab {ev.tabId} → {ev.scope ?? "Page"}
                      {ev.parentId ? ` → Widget ${ev.parentId}` : ""} → {ev.action ?? ev.property ?? "event"}
                    </div>
                    <div className="dbg2-tooltip-item-meta">{formatTimeIso(ev.date)}</div>
                  </div>
                );
              })
            )}
          </div>
          {isFrozen ? <div className="dbg2-hint">Frozen — click to unfreeze</div> : <div className="dbg2-hint">Click to freeze</div>}
        </div>
      )}
    </div>
  );
}
