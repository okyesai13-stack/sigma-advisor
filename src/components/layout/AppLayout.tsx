import { Outlet } from "react-router-dom";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { useIsMobile } from "@/hooks/use-mobile";
import { useState } from "react";
import { MessageCircle, LogOut } from "lucide-react";
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
    navigate("/");
  };
  const userEmail = user?.email || "";
  const userName = user?.user_metadata?.full_name || userEmail.split("@")[0];

  if (isMobile) {
    return (
      <div className="h-screen flex flex-col">
        <div className="h-12 border-b hairline bg-background flex items-center justify-between px-4 shrink-0">
          <div className="flex items-baseline gap-2">
            <span className="font-serif text-lg">Planz</span>
            <span className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground truncate">{userName}</span>
          </div>
          <Button variant="ghost" size="sm" onClick={handleSignOut} className="text-xs uppercase tracking-[0.15em] text-muted-foreground">
            <LogOut className="w-3.5 h-3.5" /> Sign out
          </Button>
        </div>
        <div className="flex-1 overflow-auto"><Outlet /></div>
        <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
          <DrawerTrigger asChild>
            <Button size="icon" className="fixed bottom-4 left-4 z-50 w-12 h-12 rounded-none shadow-lg">
              <MessageCircle className="w-5 h-5" />
            </Button>
          </DrawerTrigger>
          <DrawerContent className="h-[80vh]"><AdvisorChatPanel /></DrawerContent>
        </Drawer>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      <div className="h-12 border-b hairline bg-background flex items-center justify-between px-5 shrink-0">
        <div className="flex items-baseline gap-3">
          <span className="font-serif text-xl">Planz</span>
          <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Strategy office</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-muted-foreground">{userName}</span>
          <Button variant="ghost" size="sm" onClick={handleSignOut} className="text-xs uppercase tracking-[0.15em] text-muted-foreground hover:text-foreground">
            <LogOut className="w-3.5 h-3.5" /> Sign out
          </Button>
        </div>
      </div>
      <div className="flex-1 min-h-0">
        <ResizablePanelGroup direction="horizontal">
          <ResizablePanel defaultSize={32} minSize={25} maxSize={45}>
            <AdvisorChatPanel />
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={68} minSize={45}>
            <div className="h-full overflow-auto"><Outlet /></div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
};

export default AppLayout;
