import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import SidebarLayout from "@/components/SidebarLayout";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Setup from "./pages/Setup";
import Dashboard from "./pages/Dashboard";
import Advisor from "./pages/Advisor";
import Profile from "./pages/Profile";
import Sigma from "./pages/Sigma";
import Projects from "./pages/Projects";
import Interview from "./pages/Interview";
import Resume from "./pages/Resume";
import Goals from "./pages/Goals";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/auth" element={<Auth />} />

            {/* Protected Routes with Sidebar Layout */}
            <Route element={
              <ProtectedRoute>
                <SidebarLayout />
              </ProtectedRoute>
            }>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/advisor" element={<Advisor />} />
              <Route path="/profile" element={<Profile />} />
            </Route>

            {/* Pages without sidebar */}
            <Route path="/setup" element={
              <ProtectedRoute>
                <Setup />
              </ProtectedRoute>
            } />
            
            <Route path="/sigma" element={
              <ProtectedRoute>
                <Sigma />
              </ProtectedRoute>
            } />

            <Route path="/projects" element={
              <ProtectedRoute>
                <Projects />
              </ProtectedRoute>
            } />

            <Route path="/interview" element={
              <ProtectedRoute>
                <Interview />
              </ProtectedRoute>
            } />

            <Route path="/resume" element={
              <ProtectedRoute>
                <Resume />
              </ProtectedRoute>
            } />

            <Route path="/goals" element={
              <ProtectedRoute>
                <Goals />
              </ProtectedRoute>
            } />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
