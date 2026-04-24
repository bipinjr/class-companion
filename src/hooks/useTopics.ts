import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Topic, Subject } from "@/types";

export function useTopicsBySubject() {
  return useQuery({
    queryKey: ["topics-by-subject"],
    queryFn: async () => {
      const { data: subjects, error: e1 } = await supabase
        .from("subjects")
        .select("*")
        .order("name");
      if (e1) throw e1;
      const { data: sessions, error: e2 } = await supabase
        .from("sessions")
        .select("id, subject_id");
      if (e2) throw e2;
      const { data: topics, error: e3 } = await supabase.from("topics").select("*");
      if (e3) throw e3;

      const sessionToSubject = new Map<string, string>();
      (sessions ?? []).forEach((s: any) => sessionToSubject.set(s.id, s.subject_id));

      const grouped = (subjects as Subject[]).map((subject) => {
        const subjTopics = (topics as Topic[]).filter(
          (t) => sessionToSubject.get(t.session_id) === subject.id
        );
        const completed = subjTopics.filter((t) => t.status === "completed").length;
        const inProgress = subjTopics.filter((t) => t.status === "in_progress").length;
        const total = subjTopics.length;
        const pct = total ? Math.round((completed / total) * 100) : 0;
        return { subject, topics: subjTopics, completed, inProgress, total, pct };
      });
      return grouped;
    },
  });
}
