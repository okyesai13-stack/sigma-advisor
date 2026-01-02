import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/AppSidebar"
import { Outlet } from "react-router-dom"

export default function SidebarLayout({ children }: { children?: React.ReactNode }) {
    return (
        <SidebarProvider>
            <AppSidebar />
            <main className="w-full">
                <div className="p-4 md:p-0">
                    {/* Mobile trigger */}
                    <div className="md:hidden mb-4">
                        <SidebarTrigger />
                    </div>
                    {children || <Outlet />}
                </div>
            </main>
        </SidebarProvider>
    )
}
