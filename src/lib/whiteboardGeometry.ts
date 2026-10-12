export interface SectionRect { x: number; y: number; w: number; h: number }
export interface SectionConnection { id: string; from: string; to: string; label: string }

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

export function connectionGeometry(from: SectionRect, to: SectionRect) {
  const horizontal = Math.abs(to.x + to.w / 2 - from.x - from.w / 2) >= Math.abs(to.y + to.h / 2 - from.y - from.h / 2);
  const forward = horizontal ? to.x + to.w / 2 >= from.x + from.w / 2 : to.y + to.h / 2 >= from.y + from.h / 2;
  const start = horizontal ? { x: from.x + (forward ? from.w : 0), y: from.y + from.h / 2 } : { x: from.x + from.w / 2, y: from.y + (forward ? from.h : 0) };
  const end = horizontal ? { x: to.x + (forward ? 0 : to.w), y: to.y + to.h / 2 } : { x: to.x + to.w / 2, y: to.y + (forward ? 0 : to.h) };
  const mid = { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 };
  const path = horizontal ? `M ${start.x} ${start.y} C ${mid.x} ${start.y}, ${mid.x} ${end.y}, ${end.x} ${end.y}` : `M ${start.x} ${start.y} C ${start.x} ${mid.y}, ${end.x} ${mid.y}, ${end.x} ${end.y}`;
  return { path, mid };
}