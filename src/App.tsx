import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/AppLayout";
import { WeeklyPlanner } from "@/components/WeeklyPlanner";
import { AttendanceTable } from "@/components/AttendanceTable";
import { SubjectProgress } from "@/components/SubjectProgress";
import { AssessmentLog } from "@/components/AssessmentLog";
import { TemplateManager } from "@/components/TemplateManager";
import { Settings } from "@/components/Settings";
import LockScreen from "@/pages/LockScreen";
import Welcome from "@/pages/Welcome";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Force dark mode permanently
if (typeof document !== "undefined") {
  document.documentElement.classList.add("dark");
  document.documentElement.classList.remove("light");
  document.documentElement.style.colorScheme = "dark";
}

function LockGuard({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    const locked = localStorage.getItem("tsa_locked");
    const isPublic = location.pathname === "/lock" || location.pathname === "/welcome";
    if (locked !== "false" && !isPublic) {
      navigate("/lock", { replace: true });
    }
  }, [location.pathname, navigate]);
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner position="top-right" />
      <BrowserRouter>
        <LockGuard>
          <Routes>
            <Route path="/lock" element={<LockScreen />} />
            <Route path="/welcome" element={<Welcome />} />
            <Route
              path="/*"
              element={
                <AppLayout>
                  <Routes>
                    <Route path="/" element={<WeeklyPlanner />} />
                    <Route path="/attendance" element={<AttendanceTable />} />
                    <Route path="/progress" element={<SubjectProgress />} />
                    <Route path="/assessments" element={<AssessmentLog />} />
                    <Route path="/templates" element={<TemplateManager />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </AppLayout>
              }
            />
          </Routes>
        </LockGuard>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
