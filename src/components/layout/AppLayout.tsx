import { Outlet } from "react-router-dom";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { useIsMobile } from "@/hooks/use-mobile";
import { useState } from "react";
import { MessageCircle, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import AdvisorChatPanel from "@/components/advisor/AdvisorChatPanel";

const AppLayout = () => {
  const isMobile = useIsMobile();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const userEmail = user?.email || '';
  const userName = user?.user_metadata?.full_name || userEmail.split('@')[0];

  if (isMobile) {
    return (
      <div className="h-screen flex flex-col relative">
        {/* Top bar */}
        <div className="h-12 border-b border-border/50 bg-card flex items-center justify-between px-4 shrink-0">
          <span className="text-sm font-medium text-foreground truncate">{userName}</span>
          <Button variant="ghost" size="sm" onClick={handleSignOut} className="gap-1 text-muted-foreground">
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </Button>
        </div>
        <div className="flex-1 overflow-auto">
          <Outlet />
        </div>
        <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
          <DrawerTrigger asChild>
            <Button
              size="icon"
              className="fixed bottom-4 left-4 z-50 w-12 h-12 rounded-full shadow-lg bg-primary hover:bg-primary/90"
            >
              <MessageCircle className="w-5 h-5" />
            </Button>
          </DrawerTrigger>
          <DrawerContent className="h-[80vh]">
            <AdvisorChatPanel />
          </DrawerContent>
        </Drawer>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Top bar */}
      <div className="h-11 border-b border-border/50 bg-card flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="w-3.5 h-3.5 text-primary" />
          </div>
          <span className="text-sm font-medium text-foreground">{userName}</span>
          <span className="text-xs text-muted-foreground hidden sm:inline">({userEmail})</span>
        </div>
        <Button variant="ghost" size="sm" onClick={handleSignOut} className="gap-1.5 text-muted-foreground hover:text-foreground">
          <LogOut className="w-3.5 h-3.5" />
          Sign Out
        </Button>
      </div>
      <div className="flex-1 min-h-0">
        <ResizablePanelGroup direction="horizontal">
          <ResizablePanel defaultSize={32} minSize={25} maxSize={45}>
            <AdvisorChatPanel />
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={68} minSize={45}>
            <div className="h-full overflow-auto">
              <Outlet />
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
};

export default AppLayout;
