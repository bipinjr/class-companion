import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Attendance, Student } from "@/types";

export function useStudents() {
  return useQuery({
    queryKey: ["students"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("students")
        .select("*")
        .order("roll_number", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Student[];
    },
  });
}

export function useAttendance(sessionId: string | null) {
  return useQuery({
    queryKey: ["attendance", sessionId],
    queryFn: async () => {
      if (!sessionId) return [] as Attendance[];
      const { data, error } = await supabase
        .from("attendance")
        .select("*")
        .eq("session_id", sessionId);
      if (error) throw error;
      return (data ?? []) as Attendance[];
    },
    enabled: !!sessionId,
  });
}
