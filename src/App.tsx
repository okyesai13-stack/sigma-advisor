import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ResumeProvider } from "@/contexts/ResumeContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

// Layout
import AppLayout from "@/components/layout/AppLayout";

// Pages
import LandingNoAuth from "./pages/LandingNoAuth";
import AuthPage from "./pages/AuthPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import SetupNoAuth from "./pages/SetupNoAuth";
import SigmaNoAuth from "./pages/SigmaNoAuth";
import DashboardNoAuth from "./pages/DashboardNoAuth";
import ProfilePage from "./pages/ProfilePage";
import PitchDeckPage from "./pages/PitchDeckPage";
import NotFound from "./pages/NotFound";
import WorkspacePage from "./pages/WorkspacePage";
import CanvasPage from "./pages/CanvasPage";
import StressTestPage from "./pages/StressTestPage";
import PricingPage from "./pages/PricingPage";
import RoadmapPage from "./pages/RoadmapPage";

import EngineOverview from "./pages/EngineOverview";
import WorkspaceViews from "./pages/WorkspaceViews";
import ProjectPage from "./pages/ProjectPage";
import WorkspaceUtilityPages from "./pages/WorkspaceUtilityPages";
import { EngineProjects, EngineProjectPage, EngineMyTasks, EngineTeam } from './pages/EnginePages';
import ProjectCalendar from '@/components/planning/ProjectCalendar';
import EngineReports from './pages/EngineReports';

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <ResumeProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<LandingNoAuth />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />

              {/* Protected routes with two-panel layout */}
              <Route element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }>
                <Route path="/setup" element={<SetupNoAuth />} />
                <Route path="/sigma" element={<SigmaNoAuth />} />
                <Route path="/dashboard" element={<EngineOverview />} />
                <Route path="/analysis" element={<DashboardNoAuth />} />
                <Route path="/projects" element={<EngineProjects />} />
                <Route path="/my-tasks" element={<EngineMyTasks />} />
                <Route path="/calendar" element={<ProjectCalendar />} />
                <Route path="/team" element={<EngineTeam />} />
                <Route path="/reports" element={<EngineReports />} />
                <Route path="/projects/:projectId/:view" element={<EngineProjectPage />} />
                <Route path="/projects/:projectId" element={<EngineProjectPage />} />
                <Route path="/legacy-projects/:projectId/:view" element={<ProjectPage />} />
                <Route path="/ai-assistant" element={<WorkspaceUtilityPages />} />
                <Route path="/settings" element={<WorkspaceUtilityPages />} />
                <Route path="/help" element={<WorkspaceUtilityPages />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/workspace" element={<WorkspacePage />} />
                <Route path="/workspace/:id" element={<CanvasPage />} />
                <Route path="/stress-test/:id" element={<StressTestPage />} />
                <Route path="/pricing" element={<PricingPage />} />
                <Route path="/roadmap/:id" element={<RoadmapPage />} />
              </Route>

              <Route path="/deck" element={<ProtectedRoute><PitchDeckPage /></ProtectedRoute>} />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </ResumeProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
