import { describe, it, expect } from "bun:test";
import { capabilityPlan, billingOwner, checkScope, validResult } from "../supabase/functions/_shared/planz-contract";
import { readAdvisor } from "../supabase/functions/_shared/planz-advisor";
describe("Planz AI integration rules", () => {
  it("preserves the first advisor integration's response and update event", async () => { const updates:unknown[]=[]; const res=new Response('data: {"type":"result_updated","field":"summary"}\n\ndata: {"choices":[{"delta":{"content":"Updated finance."}}]}\n\ndata: [DONE]\n\n'); expect(await readAdvisor(res,x=>updates.push(x))).toBe("Updated finance."); expect(updates).toEqual([{type:"result_updated",field:"summary"}]); });
  it("stops the advisor adapter on a terminal denial", async () => { await expect(readAdvisor(new Response('{"error":"Access denied"}',{status:403}),()=>{})).rejects.toThrow("Access denied"); });
  it("routes a Lean Canvas request only to the existing canvas capability", () => expect(capabilityPlan("LEAN_CANVAS", null)).toEqual(["canvas-assist"]));
  it("routes stress testing only to the existing stress test", () => expect(capabilityPlan("BUSINESS_STRESS_TEST", null)).toEqual(["stress-test"]));
  it("routes startup roadmap only to the existing roadmap", () => expect(capabilityPlan("STARTUP_ROADMAP", null)).toEqual(["startup-roadmap"]));
  it("does not invent a project execution agent", () => expect(capabilityPlan("PROJECT_ANALYSIS", null)).toEqual([]));
  it("does not run every specialist for a finance question", () => expect(capabilityPlan("BUSINESS_ANALYSIS", "financial-model")).toEqual(["financial-model"]));
  it("reuses all six specialists only for a full business analysis", () => expect(capabilityPlan("BUSINESS_ANALYSIS", null)).toHaveLength(6));
  it("does not charge again when the existing capability charges", () => { expect(billingOwner("startup-roadmap")).toBe("existing"); expect(billingOwner("stress-test")).toBe("existing"); expect(billingOwner("canvas-assist")).toBe("existing"); });
  it("rejects a conversation from another workspace or user", () => { const c = {user_id:"u",workspace_id:"w",project_id:"p",business_id:null}; expect(checkScope(c,"u",{workspaceId:"other",projectId:"p",businessId:null})).toBe(false); expect(checkScope(c,"other",{workspaceId:"w",projectId:"p",businessId:null})).toBe(false); expect(checkScope(c,"u",{workspaceId:"w",projectId:"p",businessId:null})).toBe(true); });
  it("rejects malformed capability results", () => expect(validResult({success:true,data:{}})).toBe(false));
});