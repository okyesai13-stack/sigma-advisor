import { Outlet } from "react-router-dom";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { useIsMobile } from "@/hooks/use-mobile";
import { useState } from "react";
import { MessageCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import AdvisorChatPanel from "@/components/advisor/AdvisorChatPanel";

const AppLayout = () => {
  const isMobile = useIsMobile();
  const [drawerOpen, setDrawerOpen] = useState(false);

  if (isMobile) {
    return (
      <div className="h-screen flex flex-col relative">
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
    <div className="h-screen">
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
  );
};

export default AppLayout;
