import type { BoardTask } from "./boardExtras";
import type { Phase } from "./roadmap";

export interface WorkspaceTask extends BoardTask { projectId: string; projectName: string }
const object = (value: unknown): Record<string, unknown> => value !== null && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
export function boardTasks(boxes: unknown): BoardTask[] {
  const tasks = object(object(boxes).__board).tasks;
  return Array.isArray(tasks) ? tasks.filter((t): t is BoardTask => {
    const row = object(t);
    return typeof row.id === "string" && typeof row.text === "string" && typeof row.owner === "string" && typeof row.due === "string" && ["todo", "doing", "done"].includes(String(row.status));
  }) : [];
}
export function roadmapPhases(value: unknown): Phase[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((p) => {
    const row = object(p);
    if (typeof row.id !== "string" || typeof row.title !== "string" || !Array.isArray(row.milestones)) return [];
    return [{ id: row.id, title: row.title, weeks: typeof row.weeks === "string" ? row.weeks : "", goal: typeof row.goal === "string" ? row.goal : "", milestones: row.milestones.flatMap((m) => {
      const item = object(m);
      return typeof item.id === "string" && typeof item.text === "string" && typeof item.done === "boolean" ? [{ id: item.id, text: item.text, done: item.done }] : [];
    }) }];
  });
}
export function isOverdue(task: BoardTask, today: string): boolean {
  return task.status !== "done" && /^\d{4}-\d{2}-\d{2}$/.test(task.due) && task.due < today;
}
export function assignedToMe(task: BoardTask, user: { id: string; email?: string; name?: string }): boolean {
  const owner = task.owner.trim().toLowerCase();
  return Boolean(owner) && [user.id, user.email, user.name].some((v) => v?.trim().toLowerCase() === owner);
}
export function completion(tasks: BoardTask[], phases: Phase[]): number | null {
  const milestones = phases.flatMap((p) => p.milestones);
  const total = tasks.length + milestones.length;
  return total ? Math.floor(((tasks.filter((t) => t.status === "done").length + milestones.filter((m) => m.done).length) / total) * 100) : null;
}
export function localDay(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}