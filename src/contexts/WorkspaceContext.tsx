import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthContext";
import { useResume } from "./ResumeContext";
import type { Tables } from "@/integrations/supabase/types";
import { boardTasks, completion, roadmapPhases, type WorkspaceTask } from "@/lib/workspace";
import type { Phase } from "@/lib/roadmap";

export interface Project extends Tables<"business_store"> { tasks: WorkspaceTask[]; phases: Phase[]; progress: number | null; status: "Active" | "Completed" | "Planning" }
export interface Activity { id: string; title: string; projectId: string; date: string }
interface WorkspaceState { projects: Project[]; tasks: WorkspaceTask[]; activity: Activity[]; risks: Tables<"idea_stress_test">[]; loading: boolean; error: string | null; reload: () => Promise<void> }
const WorkspaceContext = createContext<WorkspaceState | undefined>(undefined);
export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { resultsVersion } = useResume();
  const [projects, setProjects] = useState<Project[]>([]);
  const [activity, setActivity] = useState<Activity[]>([]);
  const [risks, setRisks] = useState<Tables<"idea_stress_test">[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const reload = useCallback(async () => {
    if (!user) { setProjects([]); setLoading(false); return; }
    setLoading(true); setError(null);
    try {
      const result = await supabase.from("business_store").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
      if (result.error) throw result.error;
      const businesses = result.data || [];
      const ids = businesses.map((b) => b.id);
      if (!ids.length) { setProjects([]); setActivity([]); setRisks([]); return; }
      const [boards, roadmaps, tests] = await Promise.all([
        supabase.from("lean_canvas").select("business_id, boxes, updated_at").in("business_id", ids),
        supabase.from("startup_roadmap").select("business_id, phases, updated_at").in("business_id", ids),
        supabase.from("idea_stress_test").select("*").in("business_id", ids).order("created_at", { ascending: false }),
      ]);
      if (boards.error || roadmaps.error || tests.error) throw boards.error || roadmaps.error || tests.error;
      setProjects(businesses.map((b) => {
        const tasks = boardTasks(boards.data?.find((x) => x.business_id === b.id)?.boxes).map((t) => ({ ...t, projectId: b.id, projectName: b.business_name }));
        const phases = roadmapPhases(roadmaps.data?.find((x) => x.business_id === b.id)?.phases);
        const pct = completion(tasks, phases);
        return { ...b, tasks, phases, progress: pct, status: pct === 100 ? "Completed" : pct === null ? "Planning" : "Active" };
      }));
      setRisks(tests.data || []);
      const name = (id: string) => businesses.find((b) => b.id === id)?.business_name || "Project";
      setActivity([
        ...businesses.map((b) => ({ id: `brief-${b.id}`, title: `${b.business_name} · brief updated`, projectId: b.id, date: b.updated_at })),
        ...(boards.data || []).map((b) => ({ id: `board-${b.business_id}`, title: `${name(b.business_id)} · whiteboard updated`, projectId: b.business_id, date: b.updated_at })),
        ...(roadmaps.data || []).map((b) => ({ id: `roadmap-${b.business_id}`, title: `${name(b.business_id)} · roadmap updated`, projectId: b.business_id, date: b.updated_at })),
      ].sort((a, b) => b.date.localeCompare(a.date)));
    } catch (e) { setError(e instanceof Error ? e.message : "Could not load your workspace. Please try again."); }
    finally { setLoading(false); }
  }, [user]);
  useEffect(() => { void reload(); }, [reload, resultsVersion]);
  return <WorkspaceContext.Provider value={{ projects, tasks: projects.flatMap((p) => p.tasks), activity, risks, loading, error, reload }}>{children}</WorkspaceContext.Provider>;
}
export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) throw new Error("useWorkspace must be used within WorkspaceProvider");
  return context;
}