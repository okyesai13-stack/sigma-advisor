import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { dateChangeWarnings } from '@/lib/planning';
import type { Milestone, MilestoneLink, Dependency } from '@/lib/planning';
import type { EngineProject, EngineTask } from '@/lib/projectEngine';
export interface Member { user_id: string; role: string; full_name: string | null; email: string | null }
interface State { milestones: Milestone[]; milestoneLinks: MilestoneLink[]; dependencies: Dependency[]; scheduleActivity: Tables<'project_schedule_activity'>[]; workspaces: Tables<'workspaces'>[]; activeId: string; switchWorkspace: (id: string) => void; members: Member[]; role?: string; projects: EngineProject[]; tasks: EngineTask[]; activity: Tables<'task_activity_logs'>[]; projectMembers: Tables<'project_members'>[]; loading: boolean; error: string; reload: () => Promise<void>; createWorkspace: (name: string, kind: string) => Promise<void>; saveProject: (values: TablesInsert<'projects'>, id?: string) => Promise<string>; saveTask: (values: TablesInsert<'tasks'>, task?: EngineTask) => Promise<void>; updateTask: (task: EngineTask, patch: TablesUpdate<'tasks'>) => Promise<void>; deleteTask: (task: EngineTask) => Promise<void> }
const Context = createContext<State | undefined>(undefined);
async function allRows<T>(fetchPage: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>) { const rows: T[] = []; for (let offset = 0; ; offset += 500) { const result = await fetchPage(offset, offset + 499); if (result.error) throw new Error(result.error.message); rows.push(...result.data || []); if ((result.data?.length || 0) < 500) return rows; } }
export function ProjectEngineProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [workspaces, setWorkspaces] = useState<Tables<'workspaces'>[]>([]);
  const [activeId, setActiveId] = useState('');
  const [members, setMembers] = useState<Member[]>([]);
  const [projects, setProjects] = useState<EngineProject[]>([]);
  const [tasks, setTasks] = useState<EngineTask[]>([]);
  const [activity, setActivity] = useState<Tables<'task_activity_logs'>[]>([]);
  const [projectMembers, setProjectMembers] = useState<Tables<'project_members'>[]>([]);
  const [milestones,setMilestones]=useState<Milestone[]>([]);
  const [milestoneLinks,setMilestoneLinks]=useState<MilestoneLink[]>([]);
  const [dependencies,setDependencies]=useState<Dependency[]>([]);
  const [scheduleActivity,setScheduleActivity]=useState<Tables<'project_schedule_activity'>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const request = useRef(0);
  const pending = useRef(new Set<string>());
  const reload = useCallback(async () => {
    const seq = ++request.current;
    if (!user) { setMilestones([]);setMilestoneLinks([]);setDependencies([]);setScheduleActivity([]);setWorkspaces([]); setProjects([]); setTasks([]); setMembers([]); setActivity([]); setProjectMembers([]); setActiveId(''); setLoading(false); return; }
    setLoading(true); setError('');
    try {
      const ws = await allRows<Tables<'workspaces'>>((a,b) => supabase.from('workspaces').select('*').order('created_at').order('id').range(a,b));
      const selected = ws.find(w => w.id === activeId)?.id || ws[0]?.id || '';
      if (seq !== request.current) return;
      setWorkspaces(ws); setActiveId(selected);
      if (!selected) { setProjects([]); setTasks([]); setMembers([]); setActivity([]); setProjectMembers([]); return; }
      const [ps, ts, roster, logs, pm, ms, ml, ds, sa] = await Promise.all([
        allRows<EngineProject>((a,b) => supabase.from('projects').select('*').eq('workspace_id',selected).order('created_at',{ascending:false}).order('id').range(a,b)),
        allRows<EngineTask>((a,b) => supabase.from('tasks').select('*').eq('workspace_id',selected).order('created_at',{ascending:false}).order('id').range(a,b)),
        supabase.rpc('workspace_roster',{ p_workspace:selected }),
        supabase.from('task_activity_logs').select('*').eq('workspace_id',selected).order('created_at',{ascending:false}).limit(100),
        allRows<Tables<'project_members'>>((a,b) => supabase.from('project_members').select('*').eq('workspace_id',selected).order('id').range(a,b)),
        allRows<Milestone>((a,b)=>supabase.from('milestones').select('*').eq('workspace_id',selected).order('id').range(a,b)),
        allRows<MilestoneLink>((a,b)=>supabase.from('milestone_tasks').select('*').order('id').range(a,b)),
        allRows<Dependency>((a,b)=>supabase.from('task_dependencies').select('*').order('id').range(a,b)),
        supabase.from('project_schedule_activity').select('*').eq('workspace_id',selected).order('created_at',{ascending:false}).limit(100),
      ]);
      if (sa.error) throw new Error(sa.error.message);
      if (roster.error || logs.error) throw new Error(roster.error?.message || logs.error?.message);
      if (seq !== request.current) return;
      setMilestones(ms);setMilestoneLinks(ml.filter(l=>ps.some(p=>p.id===l.project_id)));setDependencies(ds.filter(d=>ps.some(p=>p.id===d.project_id)));setScheduleActivity(sa.data||[]);
      setProjects(ps); setTasks(ts); setMembers(roster.data || []); setActivity(logs.data || []); setProjectMembers(pm);
    } catch(e) { if(seq===request.current) setError(e instanceof Error ? e.message : 'Could not load workspace'); }
    finally { if(seq===request.current) setLoading(false); }
  },[user,activeId]);
  useEffect(() => { void reload(); },[reload]);
  const switchWorkspace = (id: string) => { setMilestones([]);setMilestoneLinks([]);setDependencies([]);setScheduleActivity([]);setProjects([]); setTasks([]); setMembers([]); setActivity([]); setProjectMembers([]); setActiveId(id); };
  const createWorkspace = async (name:string,kind:string) => { const r = await supabase.rpc('create_workspace',{p_name:name,p_kind:kind}); if(r.error) throw new Error(r.error.message); switchWorkspace(r.data); };
  const saveProject = async (values:TablesInsert<'projects'>,id?:string) => { const q = id ? supabase.from('projects').update(values).eq('id',id) : supabase.from('projects').insert(values); const r = await q.select('id').limit(1).maybeSingle(); if(r.error || !r.data) throw new Error(r.error?.message || 'Project could not be saved'); await reload(); return r.data.id; };
  const updateTask = async (task:EngineTask,patch:TablesUpdate<'tasks'>) => {
    if((patch.start_date!==undefined&&patch.start_date!==task.start_date)||(patch.due_date!==undefined&&patch.due_date!==task.due_date)){const warnings=dateChangeWarnings(task,patch.start_date===undefined?task.start_date:patch.start_date,patch.due_date===undefined?task.due_date:patch.due_date,projects.find(p=>p.id===task.project_id),tasks,dependencies);if(warnings.length&&!window.confirm(warnings.join('\n')+'\nSave this scheduling exception?'))throw new Error('Schedule change cancelled');}
    if(pending.current.has(task.id)) throw new Error('This task is still saving');
    pending.current.add(task.id); setTasks(prev => prev.map(t => t.id===task.id ? {...t,...patch} : t));
    try { const r = await supabase.from('tasks').update({...patch,version:task.version}).eq('id',task.id).eq('version',task.version).select('*').limit(1).maybeSingle(); if(r.error || !r.data) throw new Error(r.error?.message || 'Task changed elsewhere. Refresh and try again.'); const saved=r.data; setTasks(prev => prev.map(t => t.id===saved.id ? saved : t)); await reload(); }
    catch(e) { setTasks(prev => prev.map(t => t.id===task.id ? task : t)); throw e; } finally { pending.current.delete(task.id); }
  };
  const saveTask = async (values:TablesInsert<'tasks'>,task?:EngineTask) => { if(task) return updateTask(task,values); const r=await supabase.from('tasks').insert(values); if(r.error) throw new Error(r.error.message); await reload(); };
  const deleteTask = async (task:EngineTask) => { const r=await supabase.from('tasks').delete().eq('id',task.id).eq('version',task.version).select('id'); if(r.error || !r.data?.length) throw new Error(r.error?.message || 'Task changed elsewhere. Refresh first.'); await reload(); };
  return <Context.Provider value={{milestones,milestoneLinks,dependencies,scheduleActivity,workspaces,activeId,switchWorkspace,members,role:members.find(m=>m.user_id===user?.id)?.role,projects,tasks,activity,projectMembers,loading,error,reload,createWorkspace,saveProject,saveTask,updateTask,deleteTask}}>{children}</Context.Provider>;
}
export function useProjectEngine() { const value=useContext(Context); if(!value) throw new Error('Project engine provider missing'); return value; }