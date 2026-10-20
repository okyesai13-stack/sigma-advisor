export interface Milestone { id: string; text: string; done: boolean }
export interface Phase { id: string; title: string; weeks: string; goal: string; milestones: Milestone[] }

// Share of milestones done, 0-100, rounded down.
export function progress(phases: Phase[]): number {
  const all = phases.flatMap((p) => p.milestones);
  return all.length ? Math.floor((all.filter((m) => m.done).length / all.length) * 100) : 0;
}

// The first phase that still has an unfinished milestone (the one the founder is in now).
export function currentPhaseId(phases: Phase[]): string | null {
  return phases.find((p) => p.milestones.some((m) => !m.done))?.id ?? null;
}
