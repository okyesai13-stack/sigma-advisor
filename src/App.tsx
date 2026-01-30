import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ResumeProvider } from "@/contexts/ResumeContext";

// No-auth pages
import LandingNoAuth from "./pages/LandingNoAuth";
import SetupNoAuth from "./pages/SetupNoAuth";
import SigmaNoAuth from "./pages/SigmaNoAuth";
import DashboardNoAuth from "./pages/DashboardNoAuth";
import AdvisorNoAuth from "./pages/AdvisorNoAuth";
import InterviewPrepNoAuth from "./pages/InterviewPrepNoAuth";
import SmartAnalysisNoAuth from "./pages/SmartAnalysisNoAuth";
import ResumeUpgradeNoAuth from "./pages/ResumeUpgradeNoAuth";
import MockInterviewNoAuth from "./pages/MockInterviewNoAuth";
import CareerTrajectoryNoAuth from "./pages/CareerTrajectoryNoAuth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ResumeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* No-auth flow */}
            <Route path="/" element={<LandingNoAuth />} />
            <Route path="/setup" element={<SetupNoAuth />} />
            <Route path="/sigma" element={<SigmaNoAuth />} />
            <Route path="/dashboard" element={<DashboardNoAuth />} />
            <Route path="/advisor" element={<AdvisorNoAuth />} />
            <Route path="/interview-prep" element={<InterviewPrepNoAuth />} />
            <Route path="/smart-analysis" element={<SmartAnalysisNoAuth />} />
            <Route path="/resume-upgrade" element={<ResumeUpgradeNoAuth />} />
            <Route path="/mock-interview" element={<MockInterviewNoAuth />} />
            <Route path="/career-trajectory" element={<CareerTrajectoryNoAuth />} />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ResumeProvider>
  </QueryClientProvider>
);

export default App;
