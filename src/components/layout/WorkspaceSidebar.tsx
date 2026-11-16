import { Link, useLocation } from "react-router-dom";
import { BarChart3, CalendarDays, ChevronDown, CircleHelp, FolderKanban, LayoutDashboard, ListTodo, LogOut, Settings, MessageSquare, UserCircle, Users, Layers3, PanelLeftClose } from "lucide-react";
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import WorkspaceManager from '@/components/workspace/WorkspaceManager';
export const workspaceNavigation = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "My Tasks", url: "/my-tasks", icon: ListTodo },
  { title: "Projects", url: "/projects", icon: FolderKanban },
  { title: "Calendar", url: "/calendar", icon: CalendarDays },
  { title: "Team", url: "/team", icon: Users },
  { title: "Reports", url: "/reports", icon: BarChart3 },
  { title: "Activity", url: "/activity", icon: ListTodo },
];
export default function WorkspaceSidebar({ signOut }: { signOut: () => void }) {
  const { pathname } = useLocation();
  const { state, setOpenMobile, toggleSidebar, isMobile } = useSidebar();
  const { user } = useAuth();
  const collapsed = state === "collapsed" && !isMobile;
  const nav = (items: typeof workspaceNavigation) => <SidebarMenu>{items.map((item) => <SidebarMenuItem key={item.url}><SidebarMenuButton asChild tooltip={item.title} isActive={pathname === item.url || ((item.url === "/projects" || item.url === "/ai-assistant") && pathname.startsWith(item.url + "/"))}><Link to={item.url} onClick={() => setOpenMobile(false)}><item.icon /><span>{item.title}</span></Link></SidebarMenuButton></SidebarMenuItem>)}</SidebarMenu>;
  return <Sidebar collapsible="icon"><SidebarHeader className="border-b p-3"><Link to="/dashboard" className="flex h-9 items-center gap-2 overflow-hidden"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-primary font-display font-bold text-primary-foreground">P</span>{!collapsed && <span className="font-display text-xl font-semibold">Planz</span>}</Link></SidebarHeader><SidebarContent><SidebarGroup>{collapsed?<SidebarMenuButton asChild tooltip="Workspace settings"><Link to="/team"><Layers3 /><span>Workspace</span></Link></SidebarMenuButton>:<WorkspaceManager compact />}</SidebarGroup><SidebarGroup><SidebarGroupLabel>Workspace</SidebarGroupLabel>{nav(workspaceNavigation)}</SidebarGroup><SidebarGroup><SidebarGroupLabel>Intelligence</SidebarGroupLabel>{nav([{ title: "Planz AI", url: "/ai-assistant", icon: MessageSquare }, { title: "Analyses & whiteboards", url: "/workspace", icon: Layers3 }])}</SidebarGroup></SidebarContent><SidebarFooter className="border-t p-2">{nav([{ title: "Settings", url: "/settings", icon: Settings }, { title: "Help & Support", url: "/help", icon: CircleHelp }, { title: "User Profile", url: "/profile", icon: UserCircle }])}<SidebarMenu><SidebarMenuItem><SidebarMenuButton tooltip="Logout" onClick={signOut}><LogOut /><span>Logout</span></SidebarMenuButton></SidebarMenuItem></SidebarMenu><Button variant="ghost" size="sm" className="hidden md:flex" aria-label="Collapse or expand navigation" onClick={toggleSidebar}><PanelLeftClose />{!collapsed && <span>Collapse sidebar</span>}</Button></SidebarFooter></Sidebar>;
}