// All retrieval uses the caller's RLS-scoped client. Execution projects and private
// business analyses have separate identities; never infer one from the other.
export async function loadPlanzContext(db: any, conversation: any, intent: string): Promise<Record<string, unknown>> {
  const context:Record<string, unknown> = {};
  if (conversation.workspace_id) {
    const r = await db.from("workspaces").select("id,name").eq("id",conversation.workspace_id).maybeSingle();
    if(r.error || !r.data) throw Object.assign(new Error("Workspace access unavailable"),{status:403}); context.workspace=r.data;
  }
  if(conversation.project_id) {
    const p=await db.from("projects").select("id,workspace_id,name,description,status,priority,start_date,due_date").eq("id",conversation.project_id).eq("workspace_id",conversation.workspace_id).maybeSingle();
    if(p.error || !p.data) throw Object.assign(new Error("Project access unavailable"),{status:403}); context.project=p.data;
    if(["PROJECT_ANALYSIS","GENERAL_PROJECT_ADVICE","PROJECT_STRATEGY"].includes(intent)) {
      const tasks:unknown[]=[]; for(let offset=0;;offset+=500) { const r=await db.from("tasks").select("id,title,status,priority,start_date,due_date,estimated_effort").eq("project_id",conversation.project_id).order("id").range(offset,offset+499); if(r.error) throw new Error("Could not retrieve current project tasks"); tasks.push(...r.data||[]); if((r.data?.length||0)<500) break; }
      context.tasks=tasks; const m=await db.from("milestones").select("id,title,status,due_date").eq("project_id",conversation.project_id).order("id").limit(100); if(m.error) throw new Error("Could not retrieve project milestones"); context.milestones=m.data;
    }
  }
  if(conversation.business_id && intent!=="GENERAL_CONVERSATION") {
    const b=await db.from("business_store").select("id,business_name,pitch,stage,industry,target_market,geography,raw_context,user_id").eq("id",conversation.business_id).eq("user_id",conversation.user_id).maybeSingle();
    if(b.error || !b.data) throw Object.assign(new Error("Business access unavailable"),{status:403}); context.business=b.data;
    if(["PROJECT_STRATEGY","GENERAL_PROJECT_ADVICE","BUSINESS_ANALYSIS"].includes(intent)) {
      const results:Record<string,unknown>={};
      await Promise.all(["market_research_result","competitor_analysis_result","business_plan_result","financial_model_result","marketing_strategy_result","ai_operations_result","lean_canvas","idea_stress_test","startup_roadmap"].map(async table=>{const r=await db.from(table).select("*").eq("business_id",conversation.business_id).order("created_at",{ascending:false}).limit(1).maybeSingle();if(r.error) throw new Error("Could not retrieve current business context");results[table]=r.data;})); context.results=results;
    }
  }
  return context;
}