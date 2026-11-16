import { spendCredits } from "./credits.ts";
import { capabilityPlan, specialists, type CapabilityInput, type CapabilityResult, type Specialist } from "./planz-contract.ts";
import { readAdvisor } from "./planz-advisor.ts";
const tables:Record<Specialist,string>={"market-research":"market_research_result","competitor-analysis":"competitor_analysis_result","business-plan":"business_plan_result","financial-model":"financial_model_result","marketing-strategy":"marketing_strategy_result","ai-operations":"ai_operations_result"};
export const canvasBoxes=["problem","solution","key_metrics","uvp","unfair_advantage","channels","customer_segments","cost_structure","revenue_streams"];
export const registry = Object.freeze({ ...tables, "canvas-assist":"lean_canvas", "stress-test":"idea_stress_test", "startup-roadmap":"startup_roadmap", "advisor-chat-stream":"advisor_messages" });
export async function invokeExisting(endpoint:string, payload:Record<string,unknown>, auth:string, signal:AbortSignal):Promise<Response> {
  const url=Deno.env.get("SUPABASE_URL"),key=Deno.env.get("SUPABASE_ANON_KEY");
  if(!url || !key) throw new Error("AI service configuration unavailable");
  return fetch(`${url}/functions/v1/${endpoint}`,{method:"POST",headers:{Authorization:auth,apikey:key,"Content-Type":"application/json"},body:JSON.stringify(payload),signal});
}
export async function runCapability(input:CapabilityInput, auth:string, signal:AbortSignal, onProgress:(label:string)=>void):Promise<CapabilityResult> {
  const endpoints=capabilityPlan(input.parameters.intent,input.parameters.specialist);
  const result:CapabilityResult={success:true,capability:input.parameters.intent,summary:"",data:{},records:[],warnings:[],missing:[],error:null};
  if(!input.businessId) { result.success=false;result.missing=["Select the business brief for this request."];result.summary=result.missing[0];return result; }
  if(endpoints.some(e=>specialists.includes(e as Specialist))) {
    const spent=await spendCredits(auth,endpoints.length===6?"convene":"agent_rerun");
    if(spent) throw Object.assign(new Error(spent==="insufficient_credits"?"Not enough Planz AI credits. Open Plan & AI credits to replenish your balance.":"Could not check AI credits"),{status:spent==="insufficient_credits"?402:500});
  }
  const outputs:Record<string,unknown>={};const summaries:string[]=[];
  for(const endpoint of endpoints) {
    if(signal.aborted) throw new DOMException("Stopped","AbortError");
    onProgress("Working on your request…");
    if(endpoint==="canvas-assist") {
      const boxes=input.parameters.box&&canvasBoxes.includes(input.parameters.box)?[input.parameters.box]:canvasBoxes;
      const suggestions:Record<string,string[]>={};
      for(const box of boxes) {
        const response=await invokeExisting(endpoint,{business_id:input.businessId,box,action:"ideas",notes:[]},auth,signal);const body=await parse(response);
        if(!Array.isArray(body.suggestions)||!body.suggestions.length||!body.suggestions.every((x:unknown)=>typeof x==="string")) throw new Error("Canvas returned invalid suggestions"); suggestions[box]=body.suggestions;
      }
      outputs.canvas=suggestions;result.warnings.push("Canvas suggestions are not saved until you choose Add to whiteboard.");summaries.push("Your Lean Canvas suggestions are ready.");continue;
    }
    const response=await invokeExisting(endpoint,{business_id:input.businessId,goal:input.request.slice(0,300),weeks:input.parameters.weeks},auth,signal); const body=await parse(response);
    if(specialists.includes(endpoint as Specialist)) {
      if(body.success!==true || !body.data || typeof body.data!=="object") throw new Error("Analysis returned an invalid result");
      outputs[endpoint]=body.data;summaries.push(String(body.data.summary||body.data.executive_summary||"Analysis updated."));result.records.push({table:tables[endpoint as Specialist],id:input.businessId,url:"/analysis"});
    } else if(endpoint==="stress-test") {
      if(typeof body.id!=="string"||typeof body.score!=="number"||!Array.isArray(body.risks)) throw new Error("Stress test returned an invalid result"); outputs[endpoint]=body;summaries.push(`${body.verdict}: ${body.score}/100. ${body.reason}`);result.records.push({table:"idea_stress_test",id:body.id,url:`/stress-test/${input.businessId}`});
    } else if(endpoint==="startup-roadmap") {
      if(typeof body.id!=="string"||!Array.isArray(body.phases)||!body.phases.length) throw new Error("Roadmap returned an invalid result");outputs[endpoint]=body;summaries.push(`Your ${input.parameters.weeks}-week roadmap is saved with ${body.phases.length} phases.`);result.records.push({table:"startup_roadmap",id:body.id,url:`/roadmap/${input.businessId}`});
    }
  }
  result.data=outputs;result.summary=summaries.join("\n\n");return result;
}
export async function editExisting(input:CapabilityInput,auth:string,signal:AbortSignal):Promise<CapabilityResult> {
  let update:Record<string,unknown>|null=null;
  const response=await invokeExisting("advisor-chat-stream",{business_id:input.businessId,message:input.request},auth,signal);
  const summary=await readAdvisor(response,x=>{update=x;});
  return {success:true,capability:"saved-result-edit",summary,data:{update},records:[],warnings:[],missing:[],error:null};
}
async function parse(response:Response) {const body=await response.json().catch(()=>({})); if(!response.ok || body.error) throw Object.assign(new Error(body.error||body.message||`AI request failed (${response.status})`),{status:response.status});return body;}