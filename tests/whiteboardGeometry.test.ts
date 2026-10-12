import { describe, expect, test } from "bun:test";
import { canConnect, connectionGeometry, containsNote, moveSectionNotes } from "../src/lib/whiteboardGeometry";

describe("whiteboard section mapping", () => {
  test("moving a section carries its notes, leaving other notes in place", () => {
    const notes = [{ id: "inside", x: 20, y: 60 }, { id: "outside", x: 900, y: 600 }];
    const moved = moveSectionNotes(notes, notes, ["inside"], 120, -40);
    expect(moved).toEqual([{ id: "inside", x: 140, y: 20 }, { id: "outside", x: 900, y: 600 }]);
    expect(moveSectionNotes(moved, notes, ["inside"], 160, -20)[0]).toEqual({ id: "inside", x: 180, y: 40 });
  });
  test("note membership uses the section's new position", () => {
    const section = { x: 400, y: 200, w: 300, h: 340 };
    expect(containsNote(section, { x: 420, y: 260 })).toBe(true);
    expect(containsNote(section, { x: 20, y: 60 })).toBe(false);
  });
  test("mapping rejects self-links and duplicate arrows", () => {
    const connections = [{ id: "one", from: "ca", to: "fm", label: "Pricing" }];
    expect(canConnect(connections, "ca", "fm")).toBe(false);
    expect(canConnect(connections, "ca", "ca")).toBe(false);
    expect(canConnect(connections, "fm", "ca")).toBe(true);
    expect(canConnect(connections, "ms", "fm")).toBe(true);
  });
  test("connections stay anchored to section edges when sections move", () => {
    const from = { x: 0, y: 0, w: 300, h: 340 };
    const to = { x: 600, y: 0, w: 300, h: 340 };
    expect(connectionGeometry(from, to).path).toBe("M 300 170 C 450 170, 450 170, 600 170");
    expect(connectionGeometry({ ...from, x: 100 }, to).path).toBe("M 400 170 C 500 170, 500 170, 600 170");
  });
  test("flow arrows connect the selected sides of any two sections", () => {
    const from = { x: 0, y: 0, w: 300, h: 340 };
    const to = { x: 600, y: 500, w: 640, h: 520 };
    const path = connectionGeometry(from, to, "bottom", "left").path;
    expect(path.startsWith("M 150 340 C 150 ")).toBe(true);
    expect(path.endsWith(", 600 760")).toBe(true);
    expect(connectionGeometry(from, { ...to, x: 800 }, "bottom", "left").path.endsWith(", 800 760")).toBe(true);
  });
});