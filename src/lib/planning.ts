import { addDays, format, differenceInCalendarDays, parseISO } from 'date-fns';
import type { Tables } from '@/integrations/supabase/types';
import type { EngineTask, EngineProject } from './projectEngine';
export type Milestone = Tables<'milestones'>;
export type Dependency = Tables<'task_dependencies'>;
export type MilestoneLink = Tables<'milestone_tasks'>;
export const milestoneStatuses = ['Upcoming','In Progress','Completed','Delayed'];
export const day = (value: Date) => format(value,'yyyy-MM-dd');
export const shiftDay = (value: string, delta: number) => day(addDays(parseISO(value),delta));
export const daysBetween = (a: string,b: string) => differenceInCalendarDays(parseISO(b),parseISO(a));
export function linkedProgress(m: string, links: Pick<MilestoneLink,'milestone_id'|'task_id'>[], tasks: Pick<EngineTask,'id'|'status'>[]) {
 const ids=new Set(links.filter(l=>l.milestone_id===m).map(l=>l.task_id)); const linked=tasks.filter(t=>ids.has(t.id));
 return {total:linked.length,done:linked.filter(t=>t.status==='done').length,percent:linked.length?Math.floor(linked.filter(t=>t.status==='done').length/linked.length*100):null};
}
export function blockedTask(task: Pick<EngineTask,'id'|'status'>, tasks: Pick<EngineTask,'id'|'status'>[], deps: Pick<Dependency,'dependency_type'|'successor_task_id'|'predecessor_task_id'>[]) { return task.status!=='done'&&deps.some(d=>d.dependency_type==='FS'&&d.successor_task_id===task.id&&tasks.some(p=>p.id===d.predecessor_task_id&&p.status!=='done')); }
export interface ScheduleWarning {id:string;kind:'task'|'milestone';projectId:string;title:string;message:string}
export function scheduleWarnings(projects: Pick<EngineProject,'id'|'start_date'|'due_date'>[], tasks: Pick<EngineTask,'id'|'project_id'|'title'|'status'|'start_date'|'due_date'>[], milestones: Pick<Milestone,'id'|'project_id'|'title'|'status'|'start_date'|'due_date'>[], deps: Pick<Dependency,'predecessor_task_id'|'successor_task_id'|'dependency_type'>[], today:string) {
 const warnings:ScheduleWarning[]=[];
 for(const t of tasks){const add=(message:string)=>warnings.push({id:t.id,kind:'task',projectId:t.project_id,title:t.title,message});const p=projects.find(p=>p.id===t.project_id);
 if(!t.start_date)add('Missing start date');if(!t.due_date)add('Missing due date');
 if(t.start_date&&t.due_date&&t.due_date<t.start_date)add('Due date is before start date');
 if(t.status!=='done'&&t.due_date&&t.due_date<today)add('Overdue task');
 if(blockedTask(t,tasks,deps))add('Blocked by incomplete prerequisite');
 if((p?.start_date&&t.start_date&&t.start_date<p.start_date)||(p?.due_date&&t.due_date&&t.due_date>p.due_date))add('Outside project date range');
 for(const d of deps.filter(d=>d.successor_task_id===t.id&&d.dependency_type==='FS')){const before=tasks.find(p=>p.id===d.predecessor_task_id);if(before?.due_date&&t.start_date&&t.start_date<before.due_date)add(`Starts before prerequisite “${before.title}” finishes`);}
 }
 for(const m of milestones){if(m.status!=='Completed'&&m.due_date&&m.due_date<today)warnings.push({id:m.id,kind:'milestone',projectId:m.project_id,title:m.title,message:'Overdue milestone'});if(m.status==='Delayed')warnings.push({id:m.id,kind:'milestone',projectId:m.project_id,title:m.title,message:'Delayed milestone'});}
 return warnings;
}
export function dateChangeWarnings(task: EngineTask,start: string|null,due:string|null,project:EngineProject|undefined,tasks:EngineTask[],deps:Dependency[]) {
 const warnings:string[]=[];
 if(project?.start_date&&start&&start<project.start_date)warnings.push('Starts before the project');
 if(project?.due_date&&due&&due>project.due_date)warnings.push('Finishes after the project deadline');
 for(const d of deps.filter(d=>d.dependency_type==='FS')){if(d.successor_task_id===task.id){const p=tasks.find(t=>t.id===d.predecessor_task_id);if(p?.due_date&&start&&start<p.due_date)warnings.push(`Starts before ${p.title} finishes`);}if(d.predecessor_task_id===task.id){const s=tasks.find(t=>t.id===d.successor_task_id);if(s){warnings.push(`Dependent task: ${s.title}. It will not move automatically.`);if(due&&s.start_date&&s.start_date<due)warnings.push(`${s.title} starts before the new finish date`);}}}
 return warnings;
}
export interface CalendarEvent {id:string;recordId:string;projectId:string;date:string;kind:'task'|'milestone'|'project';edge:'start'|'due';title:string;status:string;assignee:string|null}
export function calendarEvents(projects:Pick<EngineProject,'id'|'name'|'due_date'|'status'|'owner_id'>[],tasks:Pick<EngineTask,'id'|'project_id'|'title'|'start_date'|'due_date'|'status'|'assignee_id'>[],milestones:Pick<Milestone,'id'|'project_id'|'title'|'start_date'|'due_date'|'status'|'owner_id'>[]):CalendarEvent[]{
 const events:CalendarEvent[]=[];for(const t of tasks)for(const edge of ['start','due'] as const){const date=edge==='start'?t.start_date:t.due_date;if(date)events.push({id:`task-${t.id}-${edge}`,recordId:t.id,projectId:t.project_id,date,kind:'task',edge,title:t.title,status:t.status,assignee:t.assignee_id});}
 for(const m of milestones)for(const edge of ['start','due'] as const){const date=edge==='start'?m.start_date:m.due_date;if(date)events.push({id:`milestone-${m.id}-${edge}`,recordId:m.id,projectId:m.project_id,date,kind:'milestone',edge,title:m.title,status:m.status,assignee:m.owner_id});}
 for(const p of projects)if(p.due_date)events.push({id:`project-${p.id}`,recordId:p.id,projectId:p.id,date:p.due_date,kind:'project',edge:'due',title:p.name,status:p.status,assignee:p.owner_id});return events.sort((a,b)=>a.date.localeCompare(b.date));
}
