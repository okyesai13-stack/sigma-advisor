import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { useIsMobile } from "@/hooks/use-mobile";
import { useState } from "react";
import { LayoutDashboard, LogOut, MessageCircle, PanelRightClose, UserCircle, Plus, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
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
  const pageLabel = location.pathname === "/dashboard" ? "Strategy dossier" : location.pathname === "/profile" ? "Profile" : location.pathname === "/sigma" ? "Agent session" : "Business brief";

  const Header = () => (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-background/90 px-4 backdrop-blur-xl md:px-5">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2" aria-label="Open dashboard">
          <span className="grid h-7 w-7 place-items-center rounded bg-primary font-display text-xs font-bold text-primary-foreground">P</span>
          <span className="font-display text-lg font-semibold">Planz</span>
        </button>
        <span className="hidden h-5 w-px bg-border sm:block" />
        <span className="hidden text-xs text-muted-foreground sm:block">{pageLabel}</span>
      </div>
      <div className="flex items-center gap-1">
        {!isMobile && <button onClick={() => navigate('/profile')} className="mr-2 text-xs text-muted-foreground hover:text-foreground">{userName}</button>}
        <Button variant="ghost" size="icon" onClick={() => navigate('/profile')} title="Profile"><UserCircle /></Button>
        <Button variant="ghost" size="icon" onClick={() => navigate('/setup')} title="New brief"><Plus /></Button>
        <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')} title="Dashboard"><LayoutDashboard /></Button>
        <Button variant="ghost" size="icon" onClick={handleSignOut} title="Sign out"><LogOut /></Button>
        <span className="mx-1 hidden h-5 w-px bg-border sm:block" />
        <Button
          variant="ghost"
          size="icon"
          onClick={() => (isMobile ? setDrawerOpen(true) : setChatOpen((v) => !v))}
          title={isMobile ? "Open AI advisor" : chatOpen ? "Close AI advisor" : "Open AI advisor"}
          aria-label={isMobile ? "Open AI advisor" : chatOpen ? "Close AI advisor" : "Open AI advisor"}
        >
          {isMobile || !chatOpen ? <MessageCircle /> : <PanelRightClose />}
        </Button>
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
