import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ClipboardList } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import type { Assessment, Session, Subject, Topic } from "@/types";

export function AssessmentLog() {
  const [filterSubject, setFilterSubject] = useState("all");
  const [filterType, setFilterType] = useState("all");

  const { data } = useQuery({
    queryKey: ["assessments-log"],
    queryFn: async () => {
      const [a, s, sub, t] = await Promise.all([
        supabase.from("assessments").select("*"),
        supabase.from("sessions").select("*"),
        supabase.from("subjects").select("*"),
        supabase.from("topics").select("*"),
      ]);
      return {
        assessments: (a.data ?? []) as Assessment[],
        sessions: (s.data ?? []) as Session[],
        subjects: (sub.data ?? []) as Subject[],
        topics: (t.data ?? []) as Topic[],
      };
    },
  });

  const rows = useMemo(() => {
    if (!data) return [];
    return data.assessments
      .map((a) => {
        const session = data.sessions.find((s) => s.id === a.session_id);
        if (!session) return null;
        const subject = data.subjects.find((s) => s.id === session.subject_id);
        const topic = data.topics.find((t) => t.session_id === session.id);
        return { assessment: a, session, subject, topic };
      })
      .filter(Boolean) as Array<{
      assessment: Assessment;
      session: Session;
      subject: Subject;
      topic?: Topic;
    }>;
  }, [data]);

  const filtered = rows.filter(
    (r) =>
      (filterSubject === "all" || r.subject.id === filterSubject) &&
      (filterType === "all" || r.assessment.type === filterType)
  );

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <ClipboardList className="h-6 w-6 text-primary" /> Assessments
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">All logged assessments across sessions</p>
      </div>

      <div className="neo-card p-4 flex flex-wrap gap-3">
        <Select value={filterSubject} onValueChange={setFilterSubject}>
          <SelectTrigger className="w-[220px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All subjects</SelectItem>
            {data?.subjects.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="Quiz">Quiz</SelectItem>
            <SelectItem value="Assignment">Assignment</SelectItem>
            <SelectItem value="Test">Test</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="neo-card overflow-hidden">
        <div className="grid grid-cols-[110px_1fr_1fr_100px_100px_110px] bg-secondary/50 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <div>Date</div>
          <div>Subject</div>
          <div>Topic</div>
          <div>Type</div>
          <div className="text-center">Avg</div>
          <div className="text-center">Completion</div>
        </div>
        <div className="divide-y divide-border max-h-[60vh] overflow-y-auto">
          {filtered.map(({ assessment, session, subject, topic }) => (
            <div
              key={assessment.id}
              className="grid grid-cols-[110px_1fr_1fr_100px_100px_110px] px-4 py-3 items-center text-sm hover:bg-secondary/30"
            >
              <div className="text-xs text-muted-foreground">{session.date}</div>
              <div className="font-medium">{subject.name}</div>
              <div className="text-muted-foreground line-clamp-1">{topic?.title ?? "—"}</div>
              <div>
                <Badge variant="outline" className="text-[11px]">
                  {assessment.type}
                </Badge>
              </div>
              <div className="text-center font-semibold text-primary">
                {assessment.avg_score ?? "—"}%
              </div>
              <div className="text-center text-muted-foreground">
                {assessment.completion_rate ?? "—"}%
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="px-4 py-10 text-center text-sm text-muted-foreground italic">
              No assessments match your filters
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
