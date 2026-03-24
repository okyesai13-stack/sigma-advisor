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
import InterviewPrepNoAuth from "./pages/InterviewPrepNoAuth";
import SmartAnalysisNoAuth from "./pages/SmartAnalysisNoAuth";
import ResumeUpgradeNoAuth from "./pages/ResumeUpgradeNoAuth";
import MockInterviewNoAuth from "./pages/MockInterviewNoAuth";
import CareerTrajectoryNoAuth from "./pages/CareerTrajectoryNoAuth";
import AILearningHubNoAuth from "./pages/AILearningHubNoAuth";
import ProjectBuilderNoAuth from "./pages/ProjectBuilderNoAuth";
import AIRolesNoAuth from "./pages/AIRolesNoAuth";
import JobFinderNoAuth from "./pages/JobFinderNoAuth";
import NotFound from "./pages/NotFound";

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
                <Route path="/dashboard" element={<DashboardNoAuth />} />
                <Route path="/interview-prep" element={<InterviewPrepNoAuth />} />
                <Route path="/smart-analysis" element={<SmartAnalysisNoAuth />} />
                <Route path="/resume-upgrade" element={<ResumeUpgradeNoAuth />} />
                <Route path="/mock-interview" element={<MockInterviewNoAuth />} />
                <Route path="/career-trajectory" element={<CareerTrajectoryNoAuth />} />
                <Route path="/ai-learning" element={<AILearningHubNoAuth />} />
                <Route path="/project-builder" element={<ProjectBuilderNoAuth />} />
                <Route path="/ai-roles" element={<AIRolesNoAuth />} />
                <Route path="/job-finder" element={<JobFinderNoAuth />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </ResumeProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
