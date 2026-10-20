import { describe, it, expect } from "vitest";
import { progress, currentPhaseId, type Phase } from "../src/lib/roadmap";
import { CREDIT_COSTS } from "../src/lib/credits";

const ph = (id: string, done: boolean[]): Phase => ({ id, title: id, weeks: "", goal: "", milestones: done.map((d, i) => ({ id: id + i, text: "x", done: d })) });

describe("roadmap", () => {
  it("progress counts done milestones", () => expect(progress([ph("a", [true, true]), ph("b", [false, true])])).toBe(75));
  it("empty roadmap is 0%", () => expect(progress([])).toBe(0));
  it("current phase is first with open milestones", () => expect(currentPhaseId([ph("a", [true]), ph("b", [false]), ph("c", [false])])).toBe("b"));
  it("building a roadmap costs 3 credits", () => expect(CREDIT_COSTS.roadmap).toBe(3));
});
