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
    SidebarTrigger,
} from "@/components/ui/sidebar";
import {
    User,
    Sparkles,
    LogOut,
    LayoutDashboard,
    MessageSquare,
    Plus,
    Target,
    Briefcase,
    GraduationCap,
    Rocket,
    ChevronRight,
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface ChatSession {
    id: string;
    title: string;
    created_at: string;
    updated_at: string;
}

interface UserGoal {
    goal_type: string | null;
    goal_description: string | null;
    target_role: string | null;
}

const items = [
    {
        title: "Dashboard",
        url: "/dashboard",
        icon: LayoutDashboard,
    },
    {
        title: "Advisor",
        url: "/advisor",
        icon: Sparkles,
    },
];

export function AppSidebar() {
    const location = useLocation();
    const navigate = useNavigate();
    const { signOut, user } = useAuth();
    const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
    const [loadingSessions, setLoadingSessions] = useState(false);
    const [userGoal, setUserGoal] = useState<UserGoal | null>(null);

    useEffect(() => {
        if (user) {
            loadChatSessions();
            loadUserGoal();
        }
    }, [user]);

    // Refresh chat sessions when location changes (to catch new chats)
    useEffect(() => {
        if (user && location.pathname === '/advisor') {
            loadChatSessions();
        }
    }, [user, location.pathname]);

    const loadUserGoal = async () => {
        if (!user) return;

        try {
            // Get user profile goal
            const { data: profileData } = await supabase
                .from('users_profile')
                .select('goal_type, goal_description')
                .eq('id', user.id)
                .maybeSingle();

            // Get career advice for target role
            const { data: careerData } = await supabase
                .from('resume_career_advice')
                .select('career_advice')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();

            const careerAdvice = careerData?.career_advice as any;
            const targetRole = careerAdvice?.roles?.[0]?.role || null;

            setUserGoal({
                goal_type: profileData?.goal_type || null,
                goal_description: profileData?.goal_description || null,
                target_role: targetRole
            });
        } catch (error) {
            console.error('Error loading user goal:', error);
        }
    };

    const loadChatSessions = async () => {
        if (!user) return;
        setLoadingSessions(true);

        try {
            const { data, error } = await supabase
                .from('advisor_chat_sessions')
                .select('*')
                .eq('user_id', user.id)
                .order('updated_at', { ascending: false })
                .limit(10); // Limit to recent 10 chats

            if (error) throw error;
            setChatSessions(data || []);
        } catch (error) {
            console.error('Error loading chat sessions:', error);
        } finally {
            setLoadingSessions(false);
        }
    };

    const getGoalIcon = () => {
        switch (userGoal?.goal_type) {
            case 'job': return Briefcase;
            case 'startup': return Rocket;
            case 'learn': return GraduationCap;
            default: return Target;
        }
    };

    const getGoalLabel = () => {
        if (userGoal?.target_role) return userGoal.target_role;
        if (userGoal?.goal_description) return userGoal.goal_description;
        switch (userGoal?.goal_type) {
            case 'job': return 'Get a Job';
            case 'startup': return 'Start a Business';
            case 'learn': return 'Learn Skills';
            default: return 'Set Your Goal';
        }
    };

    const GoalIcon = getGoalIcon();

    return (
        <Sidebar collapsible="icon">
            <SidebarHeader>
                <div className="flex items-center justify-between p-2">
                    <SidebarTrigger className="h-8 w-8" />
                </div>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link to="/dashboard">
                                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/60 text-primary-foreground">
                                    <Sparkles className="size-4" />
                                </div>
                                <div className="flex flex-col gap-0.5 leading-none">
                                    <span className="font-semibold">Career Advisor</span>
                                    <span className="text-xs text-muted-foreground">Sigma Assistant</span>
                                </div>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>
            <SidebarContent>
                {/* User Goal Card */}
                <SidebarGroup>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <SidebarMenuButton 
                                    onClick={() => navigate('/goals')}
                                    isActive={location.pathname === '/goals'}
                                    tooltip="View Career Roadmap"
                                    className="h-auto py-3 group"
                                >
                                    <div className="flex items-center gap-3 w-full">
                                        <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-primary/20 to-accent flex items-center justify-center shrink-0 group-hover:from-primary/30 transition-colors">
                                            <GoalIcon className="h-4 w-4 text-primary" />
                                        </div>
                                        <div className="flex-1 min-w-0 text-left">
                                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                                                {userGoal?.goal_type ? `${userGoal.goal_type} Goal` : 'Your Goal'}
                                            </p>
                                            <p className="text-sm font-medium text-foreground truncate">
                                                {getGoalLabel()}
                                            </p>
                                        </div>
                                        <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                                    </div>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

                <SidebarGroup>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {items.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton asChild isActive={location.pathname === item.url} tooltip={item.title}>
                                        <Link to={item.url}>
                                            <item.icon />
                                            <span>{item.title}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

                {/* Chat Sessions */}
                <SidebarGroup>
                    <SidebarGroupLabel className="flex items-center justify-between">
                        <span>Recent Chats</span>
                        <Link to="/advisor" className="opacity-60 hover:opacity-100">
                            <Plus className="w-4 h-4" />
                        </Link>
                    </SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {loadingSessions ? (
                                <SidebarMenuItem>
                                    <SidebarMenuButton disabled>
                                        <div className="w-4 h-4 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
                                        <span>Loading...</span>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ) : chatSessions.length === 0 ? (
                                <SidebarMenuItem>
                                    <SidebarMenuButton disabled>
                                        <MessageSquare className="w-4 h-4 opacity-50" />
                                        <span className="text-muted-foreground">No chats yet</span>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ) : (
                                chatSessions.map((session) => (
                                    <SidebarMenuItem key={session.id}>
                                        <SidebarMenuButton asChild tooltip={session.title}>
                                            <Link to={`/advisor?session=${session.id}`}>
                                                <MessageSquare className="w-4 h-4" />
                                                <span className="truncate">{session.title}</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                ))
                            )}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
            <SidebarFooter>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton asChild isActive={location.pathname === "/profile"} tooltip="Profile">
                            <Link to="/profile">
                                <User />
                                <span>Profile</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
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
