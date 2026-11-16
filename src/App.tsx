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

import OverviewPage from "./pages/OverviewPage";
import WorkspaceViews from "./pages/WorkspaceViews";
import ProjectPage from "./pages/ProjectPage";
import WorkspaceUtilityPages from "./pages/WorkspaceUtilityPages";

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
                <Route path="/dashboard" element={<OverviewPage />} />
                <Route path="/analysis" element={<DashboardNoAuth />} />
                <Route path="/projects" element={<WorkspaceViews />} />
                <Route path="/my-tasks" element={<WorkspaceViews />} />
                <Route path="/calendar" element={<WorkspaceViews />} />
                <Route path="/team" element={<WorkspaceViews />} />
                <Route path="/reports" element={<WorkspaceViews />} />
                <Route path="/projects/:projectId/:view" element={<ProjectPage />} />
                <Route path="/projects/:projectId" element={<ProjectPage />} />
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
