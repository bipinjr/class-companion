import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Week } from "@/types";

export function useWeek() {
  return useQuery({
    queryKey: ["current-week"],
    queryFn: async (): Promise<Week | null> => {
      const today = new Date().toISOString().slice(0, 10);
      // Find the week containing today, else the most recent.
      const { data, error } = await supabase
        .from("weeks")
        .select("*")
        .lte("start_date", today)
        .gte("end_date", today)
        .maybeSingle();
      if (error) throw error;
      if (data) return data as Week;
      const { data: latest } = await supabase
        .from("weeks")
        .select("*")
        .order("start_date", { ascending: false })
        .limit(1)
        .maybeSingle();
      return (latest as Week) ?? null;
    },
  });
}

export function useAllWeeks() {
  return useQuery({
    queryKey: ["weeks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("weeks")
        .select("*")
        .order("start_date", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Week[];
    },
  });
}
