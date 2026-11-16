import { addDays, format, parseISO, startOfWeek, startOfMonth, differenceInCalendarDays } from 'date-fns';
import type { EngineProject, EngineTask } from './projectEngine';
import type { Milestone } from './planning';
export interface AnalyticsFilters { from:string; to:string; project:string; member:string; status:string; priority:string }
export interface ProjectReport extends EngineProject { task_count:number; done_count:number; progress:number; health:string; reason:string; milestone_count:number; milestone_done:number }
export interface TeamReport {user_id:string;name:string;role:string;assigned:number;completed:number;in_progress:number;active:number;overdue:number;workload:number}
export interface RiskReport {id:string;project_id:string;title:string;kind:string;category:string;severity:string;reason:string;action:string}
export interface AnalyticsData {generated_at:string;projects:ProjectReport[];kpis:Record<string,number|null>;statuses:{name:string;value:number}[];priorities:{name:string;value:number}[];trend:{date:string;value:number}[];team:TeamReport[];milestone_stats:Record<string,number>;milestones:(Milestone & {project_name:string;required_tasks:number;completed_tasks:number})[];milestone_total:number;risks:RiskReport[];risk_total:number;tasks:(EngineTask & {project_name:string})[];task_total:number;deadlines:{id:string;project_id:string;title:string;date:string|null;kind:string}[]}
export function dateRange(days:number,today:string){return {from:format(addDays(parseISO(today),1-days),'yyyy-MM-dd'),to:today};}
export function completionRate(done:number,total:number){return total?Math.floor(done/total*100):0;}
export function completionSeries(rows:{date:string;value:number}[],from:string,to:string,mode:string){
 const bucket=(date:Date)=>format(mode==='weekly'?startOfWeek(date,{weekStartsOn:1}):mode==='monthly'?startOfMonth(date):date,'yyyy-MM-dd');
 const values=new Map<string,number>();
 for(let i=0;i<=differenceInCalendarDays(parseISO(to),parseISO(from));i++){const key=bucket(addDays(parseISO(from),i));values.set(key,0);}
 for(const row of rows){const key=bucket(parseISO(row.date));if(values.has(key))values.set(key,(values.get(key)||0)+row.value);}
 return [...values].map(([date,value])=>({date,value}));
}
export function csvDocument(title:string,generated:string,headers:string[],rows:(string|number|null)[][],summary:string){
 const cell=(value:string|number|null)=>{let text=String(value??'');if(/^[=+@-]/.test(text))text="'"+text;return '"'+text.replace(/"/g,'""')+'"';};
 return '\uFEFF'+[[title],['Generated',generated],['Summary',summary],[],headers,...rows].map(r=>r.map(cell).join(',')).join('\r\n');
}
export function escapeHtml(text:unknown){return String(text??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]||c));}