import preview from '@/assets/planz-workspace-preview.jpg';
export default function WorkspacePreview({ className = '', priority = false }: { className?: string; priority?: boolean }) {
  return <figure className={className}><img src={preview} alt="Illustrative Planz workspace with a task board, timeline and Planz AI" width={1536} height={1024} loading={priority ? 'eager' : 'lazy'} className="h-auto w-full rounded-lg border border-border" /><figcaption className="mt-3 text-center text-xs text-muted-foreground">Product illustration · Your workspace starts with your own projects</figcaption></figure>;
}
