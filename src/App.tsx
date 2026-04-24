import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { PinGate } from "@/components/PinGate";
import { AppLayout } from "@/components/AppLayout";
import { WeeklyPlanner } from "@/components/WeeklyPlanner";
import { AttendanceTable } from "@/components/AttendanceTable";
import { SubjectProgress } from "@/components/SubjectProgress";
import { AssessmentLog } from "@/components/AssessmentLog";
import { TemplateManager } from "@/components/TemplateManager";
import { Settings } from "@/components/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner position="top-right" />
      <BrowserRouter>
        <PinGate>
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
        </PinGate>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
