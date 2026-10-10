import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { useIsMobile } from "@/hooks/use-mobile";
import { useState } from "react";
import { LayoutDashboard, LayoutGrid, LogOut, Menu, MessageCircle, PanelRightClose, UserCircle, Plus, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import AdvisorChatPanel from "@/components/advisor/AdvisorChatPanel";

const AppLayout = () => {
  const isMobile = useIsMobile();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(true);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => { await signOut(); navigate("/"); };
  const userEmail = user?.email || "";
  const userName = user?.user_metadata?.full_name || userEmail.split("@")[0];
  const pageLabel = location.pathname === "/dashboard" ? "Strategy dossier" : location.pathname === "/profile" ? "Profile" : location.pathname === "/sigma" ? "Agent session" : location.pathname.startsWith("/workspace") ? "Workspace" : "Business brief";

  const Header = () => (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-background/90 px-4 backdrop-blur-xl md:px-5">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => (isMobile ? setDrawerOpen(true) : setChatOpen((v) => !v))}
          title={isMobile ? "Open AI advisor" : chatOpen ? "Close AI advisor" : "Open AI advisor"}
          aria-label={isMobile ? "Open AI advisor" : chatOpen ? "Close AI advisor" : "Open AI advisor"}
        >
          {isMobile || !chatOpen ? <MessageCircle /> : <PanelRightClose />}
        </Button>
        <span className="h-5 w-px bg-border" />
        <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2" aria-label="Open dashboard">
          <span className="grid h-7 w-7 place-items-center rounded bg-primary font-display text-xs font-bold text-primary-foreground">P</span>
          <span className="font-display text-lg font-semibold">Planz</span>
        </button>
        <span className="hidden h-5 w-px bg-border sm:block" />
        <span className="hidden text-xs text-muted-foreground sm:block">{pageLabel}</span>
      </div>
      <div className="flex items-center gap-1">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" title="Menu" aria-label="Open navigation menu"><Menu /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="flex items-center gap-2">
              <UserCircle className="h-4 w-4 text-muted-foreground" />
              <span className="truncate">{userName}</span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/dashboard')}><LayoutDashboard className="mr-2 h-4 w-4" />Dashboard</DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/workspace')}><LayoutGrid className="mr-2 h-4 w-4" />Workspace</DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/setup')}><Plus className="mr-2 h-4 w-4" />New brief</DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/profile')}><UserCircle className="mr-2 h-4 w-4" />Profile</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut}><LogOut className="mr-2 h-4 w-4" />Sign out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );

  if (isMobile) {
    return (
      <div className="flex h-screen flex-col bg-background"><Header /><div className="min-h-0 flex-1 overflow-auto"><Outlet /></div>
        <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}><DrawerTrigger asChild><Button size="icon" className="fixed bottom-5 right-5 z-50 h-12 w-12 rounded-full shadow-glow" aria-label="Open strategy advisor"><MessageCircle /></Button></DrawerTrigger><DrawerContent className="h-[84vh] border-border bg-background"><AdvisorChatPanel /></DrawerContent></Drawer>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-background"><Header /><div className="min-h-0 flex-1">
      {chatOpen ? (
        <ResizablePanelGroup direction="horizontal">
          <ResizablePanel defaultSize={31} minSize={24} maxSize={42}><div className="h-full border-r border-border"><AdvisorChatPanel /></div></ResizablePanel>
          <ResizableHandle className="w-1 bg-border/40 transition-colors hover:bg-primary/60" />
          <ResizablePanel defaultSize={69} minSize={45}><div className="h-full overflow-auto"><Outlet /></div></ResizablePanel>
        </ResizablePanelGroup>
      ) : (
        <div className="h-full overflow-auto"><Outlet /></div>
      )}
    </div>
      {chatOpen && <div className="pointer-events-none fixed bottom-4 left-[31%] z-10 hidden -translate-x-1/2 items-center gap-1 rounded-full border border-border bg-card/80 px-2 py-1 text-[10px] text-muted-foreground backdrop-blur lg:flex"><Zap className="h-3 w-3 text-primary" /> AI advisor</div>}
    </div>
  );
};

export default AppLayout;
