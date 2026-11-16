import type { Tables } from '@/integrations/supabase/types';
export type EngineTask = Tables<'tasks'>;
export type EngineProject = Tables<'projects'>;
export const taskStatuses = [{ value: 'backlog', label: 'Backlog' }, { value: 'todo', label: 'To Do' }, { value: 'doing', label: 'In Progress' }, { value: 'review', label: 'In Review' }, { value: 'done', label: 'Done' }];
export const priorities = ['Low', 'Medium', 'High', 'Urgent'];
export const projectStatuses = ['Planning', 'Active', 'On Hold', 'Completed', 'Archived'];
export const canEdit = (role?: string) => ['owner', 'admin', 'member'].includes(role || '');
export const canManage = (role?: string) => ['owner', 'admin'].includes(role || '');
export function taskProgress(tasks: Pick<EngineTask, 'status'>[]) { return tasks.length ? Math.floor(tasks.filter(t => t.status === 'done').length / tasks.length * 100) : 0; }
export function overdueTask(task: Pick<EngineTask, 'status' | 'due_date'>, today: string) { return task.status !== 'done' && Boolean(task.due_date && task.due_date < today); }
export function validDates(start: string, due: string) { return !start || !due || due >= start; }