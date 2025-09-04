import { useMemo } from "react";
import type { TimelineEvent } from "../../types";
import { buildSpans, buildHierarchy } from "../../utils";

export function useTimelineData(events: TimelineEvent[], pixelsPerSecond: number) {
  const spans = useMemo(() => buildSpans(events), [events]);
  const hierarchy = useMemo(() => buildHierarchy(events), [events]);

  // compute bounds
  const startTime = useMemo(() => {
    if (!events || events.length === 0) return Date.now();
    return Math.min(...events.map((e) => new Date(e.date).getTime()));
  }, [events]);
  const endTime = useMemo(() => {
    if (!events || events.length === 0) return Date.now();
    return Math.max(...events.map((e) => new Date(e.date).getTime()));
  }, [events]);

  const totalSeconds = Math.max(1, Math.ceil((endTime - startTime) / 1000));
  const width = totalSeconds * pixelsPerSecond;

  const tabs = useMemo(() => Object.values(hierarchy).sort((a, b) => a.tabId - b.tabId), [hierarchy]);

  return { spans, hierarchy, startTime, endTime, totalSeconds, width, tabs };
}
