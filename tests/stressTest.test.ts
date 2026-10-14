import { describe, it, expect } from "vitest";
import { verdictFor, riskLevel, scoreChange } from "../src/lib/stressTest";

describe("stress test rules", () => {
  it("maps score to verdict bands", () => {
    expect(verdictFor(39)).toBe("Fragile");
    expect(verdictFor(40)).toBe("Shaky");
    expect(verdictFor(60)).toBe("Promising");
    expect(verdictFor(80)).toBe("Solid");
  });
  it("colours area scores", () => {
    expect(riskLevel(4)).toBe("red");
    expect(riskLevel(6)).toBe("amber");
    expect(riskLevel(7)).toBe("green");
  });
  it("computes change since last test", () => {
    expect(scoreChange(62, 50)).toBe(12);
    expect(scoreChange(62, null)).toBeNull();
  });
});
