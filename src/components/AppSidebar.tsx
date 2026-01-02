import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarRail,
    SidebarMenuSub,
    SidebarMenuSubItem,
    SidebarMenuSubButton,
} from "@/components/ui/sidebar";
import {
    User,
    LayoutDashboard,
    BrainCircuit,
    Rocket,
    Code,
    CheckCircle2,
    FileText,
    Briefcase,
    Settings,
    LogOut,
    Sparkles,
    BookOpen,
    Target,
    ChevronRight,
    TrendingUp,
    Zap
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useJourneyState } from "@/hooks/useJourneyState";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

// Menu items with optional sub-items
const items = [
    {
        title: "Advisor",
        url: "/advisor",
        icon: Sparkles,
        stateKey: "career_selected",
        items: [
            {
                title: "Career Path",
                url: "/advisor?step=career_path",
                icon: TrendingUp,
            },
            {
                title: "Skill Validation",
                url: "/advisor?step=skill_validation",
                icon: Zap,
            }
        ]
    },
    {
        title: "Learn",
        url: "/learn",
        icon: BookOpen,
        stateKey: "learning_completed"
    },
    {
        title: "Projects",
        url: "/projects",
        icon: Code,
        stateKey: "projects_completed"
    },
    {
        title: "Job Readiness",
        url: "/job-readiness",
        icon: Rocket,
        stateKey: "job_ready"
    },
    {
        title: "Interview",
        url: "/interview",
        icon: BrainCircuit,
        stateKey: "interview_completed"
    },
    {
        title: "Apply",
        url: "/apply",
        icon: Briefcase,
        stateKey: "applied"
    },
    {
        title: "Profile",
        url: "/profile",
        icon: User,
    },
];

export function AppSidebar() {
    const location = useLocation();
    const { user, signOut } = useAuth();
    const { journeyState } = useJourneyState();
    const [userGoal, setUserGoal] = useState<{ type: string; description: string } | null>(null);

    useEffect(() => {
        if (!user) return;
        const fetchGoal = async () => {
            const { data: profile } = await supabase
                .from('users_profile')
                .select('goal_type, goal_description')
                .eq('id', user.id)
                .single();

            if (profile) {
                setUserGoal({
                    type: profile.goal_type || 'Find a Job',
                    description: profile.goal_description || 'Become a professional in your field'
                });
            }
        };
        fetchGoal();
    }, [user]);

    // Calculate progress
    // Steps roughly map to the flags in JourneyState
    const steps = [
        'career_recommended',
        'career_selected',
        'skill_validated',
        'learning_completed',
        'projects_completed',
        'job_ready',
        'interview_completed'
    ];

    const completedSteps = journeyState
        ? steps.filter(step => journeyState[step as keyof typeof journeyState]).length
        : 0;

    const progress = Math.round((completedSteps / steps.length) * 100);

    return (
        <Sidebar collapsible="icon">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link to="/advisor">
                                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-gradient-hero text-primary-foreground">
                                    <LayoutDashboard className="size-4" />
                                </div>
                                <div className="flex flex-col gap-0.5 leading-none">
                                    <span className="font-semibold">AI Advisor</span>
                                    <span className="">Career Pilot</span>
                                </div>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>

                {/* User Goal Section - Only visible when expanded */}
                <div className="group-data-[collapsible=icon]:hidden px-2 py-2">
                    <div className="text-xs text-muted-foreground mb-1">Your Goal</div>
                    <div className="p-3 rounded-lg bg-accent/50 border border-border">
                        <div className="flex items-center gap-2 text-foreground font-medium mb-1 text-sm">
                            <Target className="w-3.5 h-3.5 text-primary" />
                            {userGoal?.type || 'Loading...'}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                            {userGoal?.description || '...'}
                        </p>
                    </div>
                </div>

                {/* Progress Section - Only visible when expanded */}
                <div className="group-data-[collapsible=icon]:hidden px-2 mb-2">
                    <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-muted-foreground">Overall Progress</span>
                        <span className="text-foreground font-medium">{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-1.5" />
                </div>

            </SidebarHeader>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>Journey Steps</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {items.map((item) => {
                                const isCompleted = item.stateKey && journeyState && journeyState[item.stateKey as keyof typeof journeyState];

                                // Handle Collapsible Submenus
                                if (item.items) {
                                    const isOpen = location.pathname.startsWith(item.url) || item.items.some(sub => location.search.includes(sub.url.split('?')[1]));

                                    return (
                                        <Collapsible
                                            key={item.title}
                                            asChild
                                            defaultOpen={isOpen}
                                            className="group/collapsible"
                                        >
                                            <SidebarMenuItem>
                                                <CollapsibleTrigger asChild>
                                                    <SidebarMenuButton tooltip={item.title} isActive={location.pathname === item.url && !isOpen}>
                                                        {isCompleted ? <CheckCircle2 className="text-success" /> : <item.icon />}
                                                        <span className={isCompleted ? "text-success" : ""}>{item.title}</span>
                                                        <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                                                    </SidebarMenuButton>
                                                </CollapsibleTrigger>
                                                <CollapsibleContent>
                                                    <SidebarMenuSub>
                                                        {item.items.map((subItem) => (
                                                            <SidebarMenuSubItem key={subItem.title}>
                                                                <SidebarMenuSubButton asChild isActive={location.search.includes(subItem.url.split('?')[1])}>
                                                                    <Link to={subItem.url}>
                                                                        <span>{subItem.title}</span>
                                                                    </Link>
                                                                </SidebarMenuSubButton>
                                                            </SidebarMenuSubItem>
                                                        ))}
                                                    </SidebarMenuSub>
                                                </CollapsibleContent>
                                            </SidebarMenuItem>
                                        </Collapsible>
                                    );
                                }

                                return (
                                    <SidebarMenuItem key={item.title}>
                                        <SidebarMenuButton asChild isActive={location.pathname === item.url} tooltip={item.title}>
                                            <Link to={item.url}>
                                                {isCompleted ? (
                                                    <CheckCircle2 className="text-success" />
                                                ) : (
                                                    <item.icon />
                                                )}
                                                <span className={isCompleted ? "text-success" : ""}>{item.title}</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                );
                            })}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
                <SidebarGroup>
                    <SidebarGroupLabel>Settings</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild isActive={location.pathname === "/setup"} tooltip="Setup">
                                    <Link to="/setup">
                                        <Settings />
                                        <span>Setup</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
            <SidebarFooter>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            onClick={() => signOut()}
                            tooltip="Sign Out"
                        >
                            <LogOut />
                            <span>Sign Out</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    );
}
