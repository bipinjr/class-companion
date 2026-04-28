import { useParams, Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, BookOpen, CheckCircle2, Clock, Circle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from "recharts";

const STATUS_COLORS: Record<string, string> = {
  not_started: "border-slate-500/40 text-slate-400 bg-slate-500/10",
  in_progress: "border-amber-500/40 text-amber-400 bg-amber-500/10",
  completed: "border-emerald-500/40 text-emerald-400 bg-emerald-500/10",
};

export default function SubjectDetail() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["subject-detail", id],
    enabled: !!id,
    queryFn: async () => {
      const [sub, sessions, topics] = await Promise.all([
        supabase.from("subjects").select("*").eq("id", id!).maybeSingle(),
        supabase.from("sessions").select("*").eq("subject_id", id!),
        supabase.from("topics").select("*"),
      ]);
      const subjSessions = sessions.data ?? [];
      const subjSessionIds = new Set(subjSessions.map((s: any) => s.id));
      const subjTopics = (topics.data ?? []).filter((t: any) => subjSessionIds.has(t.session_id));
      return { subject: sub.data, sessions: subjSessions, topics: subjTopics };
    },
  });

  if (isLoading) return <div className="p-3 sm:p-6 text-muted-foreground">Loading…</div>;
  if (!data?.subject) return <div className="p-3 sm:p-6 text-muted-foreground">Subject not found.</div>;

  const { subject, sessions, topics } = data;
  const completed = topics.filter((t: any) => t.status === "completed").length;
  const inprog = topics.filter((t: any) => t.status === "in_progress").length;
  const notstarted = topics.length - completed - inprog;
  const pct = topics.length ? Math.round((completed / topics.length) * 100) : 0;

  const chapters = new Map<string, any[]>();
  topics.forEach((t: any) => {
    const k = t.chapter_number ?? "—";
    chapters.set(k, [...(chapters.get(k) ?? []), t]);
  });

  const completeChapter = async (ids: string[]) => {
    await supabase.from("topics").update({ status: "completed" }).in("id", ids);
    qc.invalidateQueries({ queryKey: ["subject-detail", id] });
    toast.success("Chapter marked completed");
  };

  const pieData = [
    { name: "Completed", value: completed, color: "#10b981" },
    { name: "In Progress", value: inprog, color: "#f59e0b" },
    { name: "Not Started", value: notstarted, color: "#64748b" },
  ];

  return (
    <div className="p-3 sm:p-6 space-y-5 max-w-6xl">
      <Link to="/progress">
        <Button variant="ghost" size="sm" className="-ml-2">
          <ArrowLeft className="h-4 w-4 mr-1" /> All subjects
        </Button>
      </Link>

      <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <BookOpen className="h-4 w-4" /> {subject.language_type ?? "Subject"}
            </div>
            <h1 className="text-3xl font-bold mt-1">{subject.name}</h1>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold text-primary">{pct}%</div>
            <div className="text-xs text-muted-foreground">{completed}/{topics.length} topics</div>
          </div>
        </div>
        <Progress value={pct} className="h-2 mt-4" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Stat icon={CheckCircle2} label="Completed" value={completed} color="text-emerald-400" />
        <Stat icon={Clock} label="In Progress" value={inprog} color="text-amber-400" />
        <Stat icon={Circle} label="Not Started" value={notstarted} color="text-slate-400" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-5">
          <h3 className="font-semibold mb-3">Status Breakdown</h3>
          {topics.length ? (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" innerRadius={45} outerRadius={80} paddingAngle={3}>
                    {pieData.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "rgba(0,0,0,0.9)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">No topics scheduled.</p>
          )}
        </div>

        <div className="lg:col-span-2 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-5">
          <h3 className="font-semibold mb-3">Chapters</h3>
          <div className="space-y-2">
            {[...chapters.entries()].map(([ch, ts]) => {
              const allDone = ts.every((t) => t.status === "completed");
              const anyProg = ts.some((t) => t.status === "in_progress");
              const status = allDone ? "completed" : anyProg ? "in_progress" : "not_started";
              return (
                <div key={ch} className="flex items-center justify-between gap-2 p-3 rounded-xl bg-white/5 border border-white/10">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">Chapter {ch}</span>
                      <Badge variant="outline" className={STATUS_COLORS[status]}>
                        {status === "completed" ? "Done" : status === "in_progress" ? "In Progress" : "Planned"}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                      {ts.map((t) => t.title).join(" · ")}
                    </p>
                  </div>
                  {!allDone && (
                    <Button size="sm" variant="ghost" onClick={() => completeChapter(ts.map((t) => t.id))}>
                      <CheckCircle2 className="h-4 w-4 mr-1 text-emerald-400" /> Mark done
                    </Button>
                  )}
                </div>
              );
            })}
            {chapters.size === 0 && <p className="text-sm text-muted-foreground italic">No topics yet.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value, color }: any) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-5">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
        <Icon className={`h-3.5 w-3.5 ${color}`} /> {label}
      </div>
      <div className={`text-2xl font-bold mt-2 ${color}`}>{value}</div>
    </div>
  );
}
