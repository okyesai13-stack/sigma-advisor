import { describe, expect, test } from "bun:test";
import { assignedToMe, boardTasks, completion, isOverdue, roadmapPhases } from "../src/lib/workspace";
const task = { id: "1", text: "Launch", owner: "founder@example.com", due: "2026-11-15", status: "todo" as const };
describe("real workspace data", () => {
  test("only saved board tasks are counted", () => {
    expect(boardTasks({ __board: { tasks: [task, { text: "invalid" }] } })).toEqual([task]);
    expect(boardTasks({})).toEqual([]);
  });
  test("My Tasks excludes unassigned and other owners", () => {
    const user = { id: "user-1", email: "founder@example.com" };
    expect(assignedToMe(task, user)).toBe(true);
    expect(assignedToMe({ ...task, owner: "" }, user)).toBe(false);
    expect(assignedToMe({ ...task, owner: "other@example.com" }, user)).toBe(false);
  });
  test("overdue excludes completed tasks and today's deadlines", () => {
    expect(isOverdue(task, "2026-11-16")).toBe(true);
    expect(isOverdue({ ...task, status: "done" }, "2026-11-16")).toBe(false);
    expect(isOverdue({ ...task, due: "2026-11-16" }, "2026-11-16")).toBe(false);
  });
  test("progress uses actual task and milestone completion, never fabricated percentages", () => {
    expect(completion([], [])).toBe(null);
    const phases = roadmapPhases([{ id: "phase", title: "Launch", milestones: [{ id: "m", text: "Ship", done: true }] }]);
    expect(completion([task], phases)).toBe(50);
    expect(completion([{ ...task, status: "done" }], phases)).toBe(100);
  });
});