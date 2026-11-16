import {NotificationProvider} from '@/contexts/NotificationContext';
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { useResume } from "@/contexts/ResumeContext";
import { useWorkspace, WorkspaceProvider } from "@/contexts/WorkspaceContext";
import { useToast } from "@/hooks/use-toast";
import { useProjectEngine } from "@/contexts/ProjectEngineContext";
import WorkspaceSidebar from "./WorkspaceSidebar";
import WorkspaceTopbar from "./WorkspaceTopbar";
import { ProjectEngineProvider } from '@/contexts/ProjectEngineContext';
function WorkspaceShell() {
  const { signOut } = useAuth();
  const { setBusiness, business } = useResume();
  const engine = useProjectEngine();
  const { projects, reload } = useWorkspace();
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const handleSignOut = async () => { try { await signOut(); navigate('/'); } catch { toast({ title: 'Could not sign out', variant: 'destructive' }); } };
  useEffect(() => { void reload(); }, [location.pathname, reload]);
  useEffect(() => {
    const id = location.pathname.match(/^\/(?:projects|workspace|roadmap|stress-test)\/([^/]+)/)?.[1];
    const project = projects.find((p) => p.id === id);
    if (project) setBusiness(project);
  }, [location.pathname, projects, setBusiness]);
  useEffect(() => { if (location.pathname === '/dashboard' && location.hash.startsWith('#section-')) navigate(`/analysis${location.hash}`, { replace: true }); }, [location.pathname, location.hash, navigate]);
  const openAi = () => {
    const projectId = location.pathname.match(/^\/projects\/([^/]+)/)?.[1];
    const authorizedProject = engine.projects.find(p => p.id === projectId);
    const businessId = location.pathname.match(/^\/(?:workspace|roadmap|stress-test)\/([^/]+)/)?.[1] || (location.pathname === '/analysis' ? business?.id : undefined);
    const context = new URLSearchParams();
    if (authorizedProject) context.set('project', authorizedProject.id);
    const taskId=location.pathname.match(/^\/projects\/[^/]+\/tasks\/([^/]+)/)?.[1];
    const task=engine.tasks.find(t=>t.id===taskId&&t.project_id===authorizedProject?.id);
    if(task)context.set('prompt',`Review the task “${task.title}” (record ${task.id}) and its dependencies. Recommend next steps without changing it.`);
    if (businessId && projects.some(p => p.id === businessId)) context.set('business', businessId);
    navigate(`/ai-assistant${context.size ? '?' + context.toString() : ''}`);
  };
  return <SidebarProvider className="h-dvh min-h-0"><WorkspaceSidebar signOut={() => void handleSignOut()} /><div className="flex min-w-0 flex-1 flex-col"><WorkspaceTopbar aiOpen={location.pathname.startsWith('/ai-assistant')} toggleAi={openAi} signOut={() => void handleSignOut()} /><main className="min-h-0 min-w-0 flex-1 overflow-auto"><Outlet /></main></div></SidebarProvider>;
}
export default function AppLayout() { return <WorkspaceProvider><ProjectEngineProvider><NotificationProvider><WorkspaceShell /></NotificationProvider></ProjectEngineProvider></WorkspaceProvider>; }
