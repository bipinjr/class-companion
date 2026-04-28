import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, User, CheckCircle2, XCircle, Percent } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from "recharts";

export default function StudentDetail() {
  const { id } = useParams<{ id: string }>();

  const { data, isLoading } = useQuery({
    queryKey: ["student-detail", id],
    enabled: !!id,
    queryFn: async () => {
      const [stu, att, sessions, subjects, scores] = await Promise.all([
        supabase.from("students").select("*").eq("id", id!).maybeSingle(),
        supabase.from("attendance").select("*").eq("student_id", id!),
        supabase.from("sessions").select("*"),
        supabase.from("subjects").select("*"),
        supabase.from("assessment_scores").select("*").eq("student_id", id!),
      ]);
      return {
        student: stu.data,
        attendance: att.data ?? [],
        sessions: sessions.data ?? [],
        subjects: subjects.data ?? [],
        scores: scores.data ?? [],
      };
    },
  });

  if (isLoading) return <div className="p-3 sm:p-6 text-muted-foreground">Loading…</div>;
  if (!data?.student) return <div className="p-3 sm:p-6 text-muted-foreground">Student not found.</div>;

  const { student, attendance, sessions, subjects, scores } = data;
  const present = attendance.filter((a: any) => a.status === "present").length;
  const absent = attendance.length - present;
  const pct = attendance.length ? Math.round((present / attendance.length) * 100) : 0;
  const subjectMap = new Map(subjects.map((s: any) => [s.id, s]));
  const sessionMap = new Map(sessions.map((s: any) => [s.id, s]));

  const recent = attendance
    .map((a: any) => {
      const sess = sessionMap.get(a.session_id);
      return sess ? { ...a, session: sess, subject: subjectMap.get((sess as any).subject_id) } : null;
    })
    .filter(Boolean)
    .sort((a: any, b: any) => (b.session.date > a.session.date ? 1 : -1))
    .slice(0, 12);

  const pieData = [
    { name: "Present", value: present, color: "#10b981" },
    { name: "Absent", value: absent, color: "#ef4444" },
  ];

  const avgScore = scores.length
    ? Math.round(scores.reduce((s: number, x: any) => s + Number(x.score ?? 0), 0) / scores.length)
    : null;

  return (
    <div className="p-3 sm:p-6 space-y-5 max-w-6xl">
      <Link to="/attendance">
        <Button variant="ghost" size="sm" className="-ml-2">
          <ArrowLeft className="h-4 w-4 mr-1" /> All students
        </Button>
      </Link>

      <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6 flex items-center gap-4">
        <div className="h-14 w-14 rounded-full bg-primary/20 flex items-center justify-center">
          <User className="h-7 w-7 text-primary" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground font-mono">Roll {student.roll_number}</p>
          <h1 className="text-2xl font-bold">{student.full_name}</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Stat icon={Percent} label="Attendance %" value={`${pct}%`} accent />
        <Stat icon={CheckCircle2} label="Present" value={present} />
        <Stat icon={XCircle} label="Absent" value={absent} />
        <Stat icon={Percent} label="Avg Score" value={avgScore != null ? `${avgScore}%` : "—"} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-5">
          <h3 className="font-semibold mb-3">Attendance Split</h3>
          {attendance.length ? (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" innerRadius={50} outerRadius={80} paddingAngle={3}>
                    {pieData.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "rgba(0,0,0,0.9)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">No attendance recorded.</p>
          )}
        </div>

        <div className="lg:col-span-2 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-5">
          <h3 className="font-semibold mb-3">Recent Sessions</h3>
          <div className="divide-y divide-white/10">
            {recent.length === 0 && (
              <p className="text-sm text-muted-foreground italic py-4">No sessions yet.</p>
            )}
            {recent.map((r: any) => (
              <div key={r.id} className="flex items-center justify-between py-2.5 text-sm">
                <div>
                  <div className="font-medium">{r.subject?.name ?? "—"}</div>
                  <div className="text-xs text-muted-foreground">{r.session.date}</div>
                </div>
                <Badge
                  variant="outline"
                  className={r.status === "present"
                    ? "border-emerald-500/40 text-emerald-400 bg-emerald-500/10"
                    : "border-red-500/40 text-red-400 bg-red-500/10"
                  }
                >
                  {r.status}
                </Badge>
              </div>
            ))}
          </div>
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
      <div className={`text-2xl font-bold mt-2 ${accent ? "text-primary" : ""}`}>{value}</div>
    </div>
  );
}
