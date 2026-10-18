export interface SectionRect { x: number; y: number; w: number; h: number }
export function resizeSection(rect: SectionRect, dx: number, dy: number, minWidth = 300): SectionRect {
  return { ...rect, w: Math.max(minWidth, rect.w + dx), h: Math.max(160, rect.h + dy) };
}
export type ConnectionSide = "top" | "right" | "bottom" | "left";
export interface SectionConnection { id: string; from: string; to: string; label: string; fromSide?: ConnectionSide; toSide?: ConnectionSide }

export function sectionAnchor(rect: SectionRect, side: ConnectionSide) {
  return { x: rect.x + (side === "left" ? 0 : side === "right" ? rect.w : rect.w / 2), y: rect.y + (side === "top" ? 0 : side === "bottom" ? rect.h : rect.h / 2) };
}

export const containsNote = (rect: SectionRect, note: { x: number; y: number }, width = 200) =>
  note.x + width / 2 >= rect.x && note.x + width / 2 <= rect.x + rect.w &&
  note.y + 30 >= rect.y && note.y + 30 <= rect.y + rect.h;

export function moveSectionNotes<T extends { id: string; x: number; y: number }>(notes: T[], initial: T[], ids: string[], dx: number, dy: number): T[] {
  const positions = new Map(initial.filter((n) => ids.includes(n.id)).map((n) => [n.id, n]));
  return notes.map((n) => {
    const start = positions.get(n.id);
    return start ? { ...n, x: start.x + dx, y: start.y + dy } : n;
  });
}

export const canConnect = (connections: SectionConnection[], from: string, to: string) =>
  from !== to && !connections.some((c) => c.from === from && c.to === to);

export function connectionGeometry(from: SectionRect, to: SectionRect, fromSide?: ConnectionSide, toSide?: ConnectionSide) {
  const horizontal = Math.abs(to.x + to.w / 2 - from.x - from.w / 2) >= Math.abs(to.y + to.h / 2 - from.y - from.h / 2);
  const forward = horizontal ? to.x + to.w / 2 >= from.x + from.w / 2 : to.y + to.h / 2 >= from.y + from.h / 2;
  const start = sectionAnchor(from, fromSide || (horizontal ? (forward ? "right" : "left") : (forward ? "bottom" : "top")));
  const end = sectionAnchor(to, toSide || (horizontal ? (forward ? "left" : "right") : (forward ? "top" : "bottom")));
  const mid = { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 };
  const distance = Math.max(48, Math.hypot(end.x - start.x, end.y - start.y) / 2);
  const offset = (point: { x: number; y: number }, side: ConnectionSide) => ({ x: point.x + (side === "right" ? distance : side === "left" ? -distance : 0), y: point.y + (side === "bottom" ? distance : side === "top" ? -distance : 0) });
  const c1 = offset(start, fromSide || (horizontal ? (forward ? "right" : "left") : (forward ? "bottom" : "top")));
  const c2 = offset(end, toSide || (horizontal ? (forward ? "left" : "right") : (forward ? "top" : "bottom")));
  const path = fromSide || toSide ? `M ${start.x} ${start.y} C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${end.x} ${end.y}` : horizontal ? `M ${start.x} ${start.y} C ${mid.x} ${start.y}, ${mid.x} ${end.y}, ${end.x} ${end.y}` : `M ${start.x} ${start.y} C ${start.x} ${mid.y}, ${end.x} ${mid.y}, ${end.x} ${end.y}`;
  return { path, mid, start, end };
}