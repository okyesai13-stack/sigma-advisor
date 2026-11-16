import {describe,it,expect} from 'bun:test';
import {intelligence,shift,type TaskEvidence} from '../supabase/functions/_shared/planz-intelligence';
const project={id:'p',name:'Launch',due_date:'2026-12-01',start_date:'2026-11-01',status:'Active'};
const task=(patch:Partial<TaskEvidence>={}):TaskEvidence=>({id:'a',title:'Task',status:'todo',priority:'Medium',assignee_id:'u',start_date:'2026-11-01',due_date:'2026-11-25',estimated_effort:4,completed_at:null,version:0,...patch});
const run=(tasks:TaskEvidence[],ms:any[]=[],ds:any[]=[])=>intelligence(project,tasks,ms,ds,[],'2026-11-16','2026-11-10');
describe('Stage 2 measurable intelligence',()=>{
 it('returns insufficient data without task records',()=>expect(run([]).health).toBe('Insufficient data'));
 it('reports healthy scheduled work',()=>expect(run([task()]).health).toBe('Healthy'));
 it('marks an approaching high-priority deadline at risk',()=>expect(run([task({priority:'High',due_date:'2026-11-20'})]).health).toBe('At Risk'));
 it('marks important missed deadlines delayed',()=>expect(run([task({priority:'High',due_date:'2026-11-15'})]).health).toBe('Delayed'));
 it('marks an urgent overdue dependency-blocked task critical',()=>expect(run([task({priority:'Urgent',due_date:'2026-11-15'}),task({id:'b'})],[],[{predecessor_task_id:'b',successor_task_id:'a',dependency_type:'FS'}]).health).toBe('Critical'));
 it('computes progress only from completed tasks',()=>expect(run([task({status:'done'}),task({id:'b',status:'review'})]).completion).toBe(50));
 it('uses null progress when schedule and task evidence are missing',()=>expect(run([]).completion).toBeNull());
 it('excludes unknown completion timestamps from weekly work',()=>expect(run([task({status:'done'})]).completedInPeriod).toHaveLength(0));
 it('does not count a task due today as overdue',()=>expect(run([task({due_date:'2026-11-16'})]).overdue).toBe(0));
 it('reports exact active workload without changing assignments',()=>{const t=task();expect(run([t]).workload[0]).toMatchObject({active:1,estimatedEffort:4});expect(t.assignee_id).toBe('u');});
 it('assigns transparent critical risk score 90',()=>expect(run([task({priority:'High',due_date:'2026-11-15'})]).risks[0].score).toBe(90));
 it('shifts date-only windows through month boundaries',()=>expect(shift('2026-11-28',7)).toBe('2026-12-05'));
});
