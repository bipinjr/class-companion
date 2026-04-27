import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ClipboardList, TrendingUp, Target, CheckCircle2, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import type { Assessment, Session, Subject, Topic } from "@/types";

export function AssessmentLog() {
  const navigate = useNavigate();
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
      assessment: Assessment; session: Session; subject: Subject; topic?: Topic;
    }>;
  }, [data]);

  const filtered = rows.filter(
    (r) =>
      (filterSubject === "all" || r.subject.id === filterSubject) &&
      (filterType === "all" || r.assessment.type === filterType)
  );

  const totalAssessments = filtered.length;
  const validAvgs = filtered.map((r) => r.assessment.avg_score).filter((x): x is number => x != null);
  const overallAvg = validAvgs.length ? Math.round(validAvgs.reduce((a, b) => a + b, 0) / validAvgs.length) : 0;
  const validComp = filtered.map((r) => r.assessment.completion_rate).filter((x): x is number => x != null);
  const overallComp = validComp.length ? Math.round(validComp.reduce((a, b) => a + b, 0) / validComp.length) : 0;

  const bySubject = useMemo(() => {
    const m = new Map<string, { name: string; avg: number; count: number; sum: number }>();
    filtered.forEach((r) => {
      if (r.assessment.avg_score == null) return;
      const cur = m.get(r.subject.id) ?? { name: r.subject.name, avg: 0, count: 0, sum: 0 };
      cur.count += 1;
      cur.sum += Number(r.assessment.avg_score);
      cur.avg = Math.round(cur.sum / cur.count);
      m.set(r.subject.id, cur);
    });
    return [...m.values()];
  }, [filtered]);

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <ClipboardList className="h-6 w-6 text-primary" /> Assessments
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">Performance overview & detailed reports</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Stat icon={ClipboardList} label="Total Assessments" value={totalAssessments} />
        <Stat icon={TrendingUp} label="Average Score" value={`${overallAvg}%`} accent />
        <Stat icon={CheckCircle2} label="Avg Completion" value={`${overallComp}%`} />
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-5">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <Target className="h-4 w-4 text-primary" /> Average score by subject
        </h3>
        {bySubject.length ? (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bySubject}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip contentStyle={{ background: "rgba(0,0,0,0.9)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }} />
                <Bar dataKey="avg" fill="#3B7FEB" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground italic">No data to chart.</p>
        )}
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-4 flex flex-wrap gap-3">
        <Select value={filterSubject} onValueChange={setFilterSubject}>
          <SelectTrigger className="w-[220px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All subjects</SelectItem>
            {data?.subjects.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="Quiz">Quiz</SelectItem>
            <SelectItem value="Assignment">Assignment</SelectItem>
            <SelectItem value="Test">Test</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden">
        <div className="grid grid-cols-[110px_1fr_1fr_100px_80px_90px_110px_30px] bg-white/5 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <div>Date</div><div>Subject</div><div>Topic</div><div>Type</div>
          <div className="text-center">Total</div><div className="text-center">Avg</div><div className="text-center">Completion</div><div></div>
        </div>
        <div className="divide-y divide-white/10 max-h-[60vh] overflow-y-auto">
          {filtered.map(({ assessment, session, subject, topic }) => (
            <button
              key={assessment.id}
              type="button"
              onClick={() => navigate(`/assessments/${assessment.id}`)}
              className="w-full text-left grid grid-cols-[110px_1fr_1fr_100px_80px_90px_110px_30px] px-4 py-3 items-center text-sm hover:bg-white/10 transition-colors"
            >
              <div className="text-xs text-muted-foreground">{session.date}</div>
              <div className="font-medium">{subject.name}</div>
              <div className="text-muted-foreground line-clamp-1">{topic?.title ?? "—"}</div>
              <div><Badge variant="outline" className="text-[11px]">{assessment.type}</Badge></div>
              <div className="text-center text-muted-foreground">{assessment.total_marks ?? "—"}</div>
              <div className="text-center font-semibold text-primary">{assessment.avg_score != null ? `${assessment.avg_score}%` : "—"}</div>
              <div className="text-center text-muted-foreground">{assessment.completion_rate != null ? `${assessment.completion_rate}%` : "—"}</div>
              <div className="flex justify-end"><ChevronRight className="h-4 w-4 text-muted-foreground" /></div>
            </button>
          ))}
          {filtered.length === 0 && (
            <div className="px-4 py-10 text-center text-sm text-muted-foreground italic">No assessments match your filters</div>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value, accent }: any) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-5">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
        <Icon className="h-3.5 w-3.5" /> {label}
      </div>
      <div className={`text-3xl font-bold mt-2 ${accent ? "text-primary" : ""}`}>{value}</div>
    </div>
  );
}
