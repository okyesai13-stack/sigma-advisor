import {NotificationProvider} from '@/contexts/NotificationContext';
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { useAuth } from "@/contexts/AuthContext";
import { useResume } from "@/contexts/ResumeContext";
import { useWorkspace, WorkspaceProvider } from "@/contexts/WorkspaceContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import AdvisorChatPanel from "@/components/advisor/AdvisorChatPanel";
import WorkspaceSidebar from "./WorkspaceSidebar";
import WorkspaceTopbar from "./WorkspaceTopbar";
import { ProjectEngineProvider } from '@/contexts/ProjectEngineContext';
function WorkspaceShell() {
  const [aiOpen, setAiOpen] = useState(false);
  const [wide, setWide] = useState(() => window.matchMedia("(min-width: 1280px)").matches);
  const { signOut } = useAuth();
  const { setBusiness } = useResume();
  const { projects, reload } = useWorkspace();
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    const media = window.matchMedia("(min-width: 1280px)");
    const update = () => setWide(media.matches);
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  const handleSignOut = async () => { try { await signOut(); navigate('/'); } catch { toast({ title: 'Could not sign out', variant: 'destructive' }); } };
  useEffect(() => { void reload(); }, [location.pathname, reload]);
  useEffect(() => {
    const id = location.pathname.match(/^\/(?:projects|workspace|roadmap|stress-test)\/([^/]+)/)?.[1];
    const project = projects.find((p) => p.id === id);
    if (project) setBusiness(project);
  }, [location.pathname, projects, setBusiness]);
  useEffect(() => { if (location.pathname === '/ai-assistant') setAiOpen(false); }, [location.pathname]);
  useEffect(() => { if (location.pathname === '/dashboard' && location.hash.startsWith('#section-')) navigate(`/analysis${location.hash}`, { replace: true }); }, [location.pathname, location.hash, navigate]);
  return <SidebarProvider className="h-dvh min-h-0"><WorkspaceSidebar signOut={() => void handleSignOut()} /><div className="flex min-w-0 flex-1 flex-col"><WorkspaceTopbar aiOpen={aiOpen} toggleAi={() => { if (location.pathname === '/ai-assistant') navigate('/projects'); else setAiOpen((open) => !open); }} signOut={() => void handleSignOut()} /><div className="flex min-h-0 flex-1"><main className="min-w-0 flex-1 overflow-auto"><Outlet /></main>{wide && aiOpen && <aside aria-label="AI Assistant" className="relative w-[360px] shrink-0 border-l"><Button size="icon" variant="ghost" aria-label="Close AI panel" className="absolute right-3 top-3 z-10 h-8 w-8" onClick={() => setAiOpen(false)}><X /></Button><AdvisorChatPanel /></aside>}</div></div>{!wide && <Sheet open={aiOpen} onOpenChange={setAiOpen}><SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-[420px]" side="right"><SheetTitle className="sr-only">AI Assistant</SheetTitle><SheetDescription className="sr-only">Project strategy conversation</SheetDescription><AdvisorChatPanel /></SheetContent></Sheet>}</SidebarProvider>;
}
export default function AppLayout() { return <WorkspaceProvider><ProjectEngineProvider><NotificationProvider><WorkspaceShell /></NotificationProvider></ProjectEngineProvider></WorkspaceProvider>; }
