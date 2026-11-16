export const intents = ["BUSINESS_ANALYSIS", "PROJECT_STRATEGY", "LEAN_CANVAS", "BUSINESS_STRESS_TEST", "STARTUP_ROADMAP", "PROJECT_ANALYSIS", "GENERAL_PROJECT_ADVICE", "GENERAL_CONVERSATION"] as const;
export type Intent = typeof intents[number];
export const specialists = ["market-research", "competitor-analysis", "business-plan", "financial-model", "marketing-strategy", "ai-operations"] as const;
export type Specialist = typeof specialists[number];
export interface CapabilityInput {
  requestId: string; userId: string; workspaceId: string | null; projectId: string | null;
  businessId: string | null; conversationId: string; request: string; context: Record<string, unknown>;
  parameters: { intent: Intent; specialist: Specialist | null; weeks: 8 | 12 | 24; box: string | null };
}
export interface CapabilityResult {
  success: boolean; capability: string; summary: string; data: unknown;
  records: { table: string; id: string; url: string }[]; warnings: string[]; missing: string[];
  error: { message: string; status: number } | null;
}
export function validResult(value: unknown): value is CapabilityResult {
  if (!value || typeof value !== "object") return false;
  const r = value as CapabilityResult;
  return typeof r.success === "boolean" && typeof r.capability === "string" && typeof r.summary === "string" &&
    Array.isArray(r.records) && r.records.every(x => typeof x.table === "string" && typeof x.id === "string" && typeof x.url === "string") &&
    Array.isArray(r.warnings) && r.warnings.every(x => typeof x === "string") && Array.isArray(r.missing) && r.missing.every(x => typeof x === "string") &&
    (r.error === null || (typeof r.error.message === "string" && Number.isInteger(r.error.status)));
}
export function capabilityPlan(intent: Intent, specialist: Specialist | null): string[] {
  if (intent === "BUSINESS_ANALYSIS") return specialist ? [specialist] : [...specialists];
  if (intent === "PROJECT_STRATEGY") return [specialist || "business-plan"];
  if (intent === "LEAN_CANVAS") return ["canvas-assist"];
  if (intent === "BUSINESS_STRESS_TEST") return ["stress-test"];
  if (intent === "STARTUP_ROADMAP") return ["startup-roadmap"];
  return [];
}
export function billingOwner(endpoint: string): "adapter" | "existing" | "advice" {
  return specialists.includes(endpoint as Specialist) ? "adapter" : ["canvas-assist", "stress-test", "startup-roadmap", "advisor-chat-stream"].includes(endpoint) ? "existing" : "advice";
}
export function checkScope(conversation: { user_id: string; workspace_id: string | null; project_id: string | null; business_id: string | null }, uid: string, scope: { workspaceId: string | null; projectId: string | null; businessId: string | null }): boolean {
  return conversation.user_id === uid && conversation.workspace_id === scope.workspaceId && conversation.project_id === scope.projectId && conversation.business_id === scope.businessId;
}