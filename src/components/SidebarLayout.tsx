import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/AppSidebar"
import { Outlet } from "react-router-dom"
import { Menu } from "lucide-react"

export default function SidebarLayout({ children }: { children?: React.ReactNode }) {
    return (
        <SidebarProvider>
            <AppSidebar />
            <main className="w-full relative">
                {/* Mobile Floating Sidebar Trigger - Always visible on mobile */}
                <div className="fixed top-3 left-3 z-50 md:hidden">
                    <SidebarTrigger className="h-10 w-10 bg-card border border-border shadow-lg rounded-lg flex items-center justify-center hover:bg-accent">
                        <Menu className="h-5 w-5" />
                    </SidebarTrigger>
                </div>
                <div className="md:p-0">
                    {children || <Outlet />}
                </div>
            </main>
        </SidebarProvider>
    )
}
