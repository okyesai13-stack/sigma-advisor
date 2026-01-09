import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/AppSidebar"
import { Outlet } from "react-router-dom"

export default function SidebarLayout({ children }: { children?: React.ReactNode }) {
    return (
        <SidebarProvider>
            <AppSidebar />
            <main className="w-full relative">
                {/* Fixed Sidebar trigger */}
                <div className="fixed top-4 left-4 z-50">
                    <SidebarTrigger className="md:inline-flex" />
                </div>
                <div className="p-4 md:p-0 pt-16 md:pt-4">
                    {children || <Outlet />}
                </div>
            </main>
        </SidebarProvider>
    )
}
