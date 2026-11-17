import { useState } from 'react';
import { Plus, Pencil, Users, Crown, Building2, UserRound } from 'lucide-react';
import { useProjectEngine } from '@/contexts/ProjectEngineContext';
import { supabase } from '@/integrations/supabase/client';
import { canManage } from '@/lib/projectEngine';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Choice, Field } from './EngineForms';

const initials = (v: string) => v.split(/[\s@.]+/).filter(Boolean).slice(0, 2).map(s => s[0]).join('').toUpperCase() || 'W';

export default function WorkspaceManager({ compact = false }: { compact?: boolean }) {
  const engine = useProjectEngine();
  const active = engine.workspaces.find(w => w.id === engine.activeId);
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState(false);
  const [name, setName] = useState('');
  const [kind, setKind] = useState('team');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const owner = engine.members.find(m => m.user_id === active?.owner_id);
  const ownerName = owner?.full_name || owner?.email || 'Workspace owner';

  const switcher = engine.workspaces.length > 0 && (
    <Select value={engine.activeId || undefined} onValueChange={engine.switchWorkspace}>
      <SelectTrigger aria-label="Select workspace" className={compact ? 'h-10' : 'h-11 w-full sm:w-64'}>
        <SelectValue placeholder="Select workspace" />
      </SelectTrigger>
      <SelectContent>
        {engine.workspaces.map(w => (
          <SelectItem key={w.id} value={w.id}>
            <span className="flex items-center gap-2">
              <span className="grid h-5 w-5 place-items-center rounded bg-primary/10 text-[10px] font-semibold text-primary">{initials(w.name)}</span>
              {w.name}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  if (compact) return <div className="space-y-2">{switcher}</div>;

  const openCreate = () => { setEdit(false); setName(''); setKind('team'); setError(''); setOpen(true); };
  const openEdit = () => { if (!active) return; setEdit(true); setName(active.name); setError(''); setOpen(true); };

  return (
    <section className="mb-6 overflow-hidden rounded-xl border bg-card shadow-sm" aria-label="Workspace">
      <div className="flex flex-col gap-5 p-5 md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-primary font-display text-lg font-semibold text-primary-foreground">
            {initials(active?.name || 'W')}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Current workspace</p>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate font-display text-xl font-semibold">{active?.name || 'No workspace yet'}</h2>
              {active && <Badge variant="secondary" className="capitalize">{active.kind}</Badge>}
              {engine.role && <Badge variant="outline" className="capitalize">{engine.role}</Badge>}
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          {switcher}
          <div className="flex gap-2">
            {active && canManage(engine.role) && <Button variant="outline" onClick={openEdit}><Pencil />Edit</Button>}
            <Button onClick={openCreate}><Plus />New workspace</Button>
          </div>
        </div>
      </div>
      {active && (
        <div className="grid gap-px border-t bg-border sm:grid-cols-3">
          <div className="flex items-center gap-3 bg-muted/30 p-4">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-secondary text-xs font-semibold">
              {owner?.avatar_url ? <img src={owner.avatar_url} alt="" className="h-9 w-9 rounded-full object-cover" /> : initials(ownerName)}
            </span>
            <div className="min-w-0">
              <p className="flex items-center gap-1 text-xs text-muted-foreground"><Crown className="h-3 w-3" />Owner</p>
              <p className="truncate text-sm font-medium">{ownerName}</p>
              {owner?.email && owner.full_name && <p className="truncate text-xs text-muted-foreground">{owner.email}</p>}
            </div>
          </div>
          <div className="flex items-center gap-3 bg-muted/30 p-4">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-secondary"><Users className="h-4 w-4" /></span>
            <div><p className="text-xs text-muted-foreground">Members</p><p className="text-sm font-medium">{engine.members.length}</p></div>
          </div>
          <div className="flex items-center gap-3 bg-muted/30 p-4">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-secondary">{active.kind === 'personal' ? <UserRound className="h-4 w-4" /> : <Building2 className="h-4 w-4" />}</span>
            <div><p className="text-xs text-muted-foreground">Projects</p><p className="text-sm font-medium">{engine.projects.length}</p></div>
          </div>
        </div>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogTitle>{edit ? 'Edit workspace' : 'Create workspace'}</DialogTitle>
          <DialogDescription>{edit ? 'Rename this workspace for everyone in it.' : 'Set up a personal or team workspace.'}</DialogDescription>
          <form className="space-y-4" onSubmit={async e => { e.preventDefault(); setBusy(true); setError(''); try { if (edit && active) { const r = await supabase.from('workspaces').update({ name: name.trim() }).eq('id', active.id); if (r.error) throw new Error(r.error.message); await engine.reload(); } else await engine.createWorkspace(name, kind); setOpen(false); } catch (e) { setError(e instanceof Error ? e.message : 'Could not save workspace'); } finally { setBusy(false); } }}>
            <Field label="Workspace name"><Input required maxLength={120} value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Product team" /></Field>
            {!edit && <Choice label="Workspace type" value={kind} onChange={setKind} options={[{ value: 'personal', label: 'Personal' }, { value: 'team', label: 'Team' }]} />}
            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
            <div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button><Button disabled={busy || !name.trim()}>{busy ? 'Saving…' : edit ? 'Save changes' : 'Create workspace'}</Button></div>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
}
