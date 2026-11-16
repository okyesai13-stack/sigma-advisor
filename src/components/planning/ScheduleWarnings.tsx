import {Link} from 'react-router-dom';
import {useProjectEngine} from '@/contexts/ProjectEngineContext';
import {scheduleWarnings} from '@/lib/planning';
import {localDay} from '@/lib/workspace';
import {Button} from '@/components/ui/button';
import {TaskForm} from '@/components/workspace/EngineForms';
import {MilestoneForm} from './Milestones';
export default function ScheduleWarnings({projectId}:{projectId?:string}){const e=useProjectEngine();const warnings=scheduleWarnings(e.projects,e.tasks.filter(t=>!projectId||t.project_id===projectId),e.milestones.filter(m=>!projectId||m.project_id===projectId),e.dependencies,localDay());return <section className="my-6 border-y py-5"><h2 className="mb-3 font-semibold">Schedule warnings <span className="text-muted-foreground">{warnings.length}</span></h2>{!warnings.length?<p className="text-sm text-muted-foreground">No schedule warnings</p>:<div className="max-h-80 space-y-2 overflow-y-auto">{warnings.map((w,i)=>{const t=e.tasks.find(t=>t.id===w.id);const m=e.milestones.find(m=>m.id===w.id);const trigger=<Button variant="link" className="h-auto whitespace-normal p-0 text-left">{w.title}</Button>;return <div key={`${w.id}-${i}`} className="flex flex-wrap items-center gap-2 text-sm">{t?<TaskForm key={`${t.id}-${t.version}-${i}`} task={t} trigger={trigger}/>:m?<MilestoneForm key={`${m.id}-${m.version}-${i}`} milestone={m} projectId={m.project_id} trigger={trigger} />:<Link to={`/projects/${w.projectId}/list`}>{w.title}</Link>}<span className="text-destructive">— {w.message}</span></div>;})}</div>}</section>;}
