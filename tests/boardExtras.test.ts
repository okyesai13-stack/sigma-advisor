import { describe, expect, test } from "bun:test";
import { record, undo, redo, nextStatus, HISTORY_LIMIT } from "../src/lib/boardExtras";

describe("whiteboard undo/redo and tasks", () => {
  test("undo returns previous state and redo restores it", () => {
    let h = record({ past: [], future: [] }, 1);
    const u = undo(h, 2)!;
    expect(u.state).toBe(1);
    const r = redo(u.h, 1)!;
    expect(r.state).toBe(2);
  });
  test("a new change clears redo", () => {
    const u = undo(record({ past: [], future: [] }, 1), 2)!;
    expect(record(u.h, 1).future).toEqual([]);
  });
  test("history keeps at most 50 steps", () => {
    let h = { past: [] as number[], future: [] as number[] };
    for (let i = 0; i < 60; i++) h = record(h, i);
    expect(h.past.length).toBe(HISTORY_LIMIT);
    expect(h.past[0]).toBe(10);
  });
  test("task status cycles to do → doing → done", () => {
    expect(nextStatus("todo")).toBe("doing");
    expect(nextStatus("doing")).toBe("done");
    expect(nextStatus("done")).toBe("todo");
  });
});
