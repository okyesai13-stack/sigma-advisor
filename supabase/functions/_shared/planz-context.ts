// All retrieval uses the caller's RLS-scoped client. Execution projects and private
// business analyses have separate identities; never infer one from the other.
export async function loadPlanzContext(db: any, conversation: any, intent: string): Promise<Record<string, unknown>> {
  const context:Record<string, unknown> = {};
  if (conversation.workspace_id) {
    const r = await db.from("workspaces").select("id,name").eq("id",conversation.workspace_id).maybeSingle();
    if(r.error || !r.data) throw Object.assign(new Error("Workspace access unavailable"),{status:403}); context.workspace=r.data;
  }
  if(conversation.project_id) {
    const p=await db.from("projects").select("id,workspace_id,name,description,status,priority,start_date,due_date,updated_at").eq("id",conversation.project_id).eq("workspace_id",conversation.workspace_id).maybeSingle();
    if(p.error || !p.data) throw Object.assign(new Error("Project access unavailable"),{status:403}); context.project=p.data;
    if(intent!=="GENERAL_CONVERSATION") {
      const read=async(table:string,columns:string)=>{const rows:unknown[]=[];for(let offset=0;;offset+=500){const r=await db.from(table).select(columns).eq('project_id',conversation.project_id).order('id').range(offset,offset+499);if(r.error)throw new Error('Could not retrieve current project '+table);rows.push(...r.data||[]);if((r.data?.length||0)<500)break;}return rows;};
      const [tasks,milestones,dependencies,links]=await Promise.all([read('tasks','id,title,description,status,priority,assignee_id,start_date,due_date,estimated_effort,actual_effort,completed_at,created_at,version'),read('milestones','id,title,status,start_date,due_date,version'),read('task_dependencies','id,predecessor_task_id,successor_task_id,dependency_type'),read('milestone_tasks','id,milestone_id,task_id')]);
      Object.assign(context,{tasks,milestones,dependencies,links});
    }
  }
  if(conversation.workspace_id&&intent!=='GENERAL_CONVERSATION') {const team=await db.rpc('team_directory',{p_workspace:conversation.workspace_id});if(team.error)throw new Error('Could not retrieve project team');context.team=(team.data||[]).map((m:any)=>({user_id:m.user_id,full_name:m.full_name,role:m.role}));}
  if(conversation.business_id && intent!=="GENERAL_CONVERSATION" && !['PROJECT_PLANNING','TASK_BREAKDOWN','TASK_PRIORITIZATION','TASK_ESTIMATION','PROJECT_HEALTH_ANALYSIS','RISK_DETECTION','DELAY_ANALYSIS','TEAM_WORKLOAD_ANALYSIS','RESOURCE_OPTIMIZATION','PROJECT_PROGRESS_MONITORING','PROJECT_REPORT_GENERATION','PROJECT_ACTION_EXECUTION'].includes(intent)) {
    const b=await db.from("business_store").select("id,business_name,pitch,stage,industry,target_market,geography,raw_context,user_id").eq("id",conversation.business_id).eq("user_id",conversation.user_id).maybeSingle();
    if(b.error || !b.data) throw Object.assign(new Error("Business access unavailable"),{status:403}); context.business=b.data;
    if(["PROJECT_STRATEGY","GENERAL_PROJECT_ADVICE","BUSINESS_ANALYSIS","BUSINESS_STRESS_TEST","STARTUP_ROADMAP","LEAN_CANVAS"].includes(intent)) {
      const results:Record<string,unknown>={};
      await Promise.all(["market_research_result","competitor_analysis_result","business_plan_result","financial_model_result","marketing_strategy_result","ai_operations_result","lean_canvas","idea_stress_test","startup_roadmap"].map(async table=>{const r=await db.from(table).select("*").eq("business_id",conversation.business_id).order("created_at",{ascending:false}).limit(1).maybeSingle();if(r.error) throw new Error("Could not retrieve current business context");results[table]=r.data;})); context.results=results;
    }
  }
  return context;
}