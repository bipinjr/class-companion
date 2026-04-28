import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Target, TrendingUp, CheckCircle2, Calendar, BookOpen, FileText, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

export default function AssessmentDetail() {
  const { id } = useParams<{ id: string }>();

  const { data, isLoading } = useQuery({
    queryKey: ["assessment-detail", id],
    enabled: !!id,
    queryFn: async () => {
      const { data: a } = await supabase.from("assessments").select("*").eq("id", id!).maybeSingle();
      if (!a) return null;
      const [s, scores, students] = await Promise.all([
        supabase.from("sessions").select("*").eq("id", a.session_id).maybeSingle(),
        supabase.from("assessment_scores").select("*").eq("assessment_id", id!),
        supabase.from("students").select("*"),
      ]);
      const session = s.data;
      const [sub, top] = await Promise.all([
        session ? supabase.from("subjects").select("*").eq("id", session.subject_id).maybeSingle() : Promise.resolve({ data: null }),
        session ? supabase.from("topics").select("*").eq("session_id", session.id).maybeSingle() : Promise.resolve({ data: null }),
      ]);
      return {
        assessment: a,
        session,
        subject: sub.data,
        topic: top.data,
        scores: scores.data ?? [],
        students: students.data ?? [],
      };
    },
  });

  if (isLoading) return <div className="p-3 sm:p-6 text-muted-foreground">Loading…</div>;
  if (!data) return <div className="p-3 sm:p-6 text-muted-foreground">Assessment not found.</div>;

  const { assessment, session, subject, topic, scores, students } = data;
  const studentMap = new Map(students.map((s: any) => [s.id, s]));
  const chartData = scores
    .map((sc: any) => ({
      name: studentMap.get(sc.student_id)?.full_name?.split(" ")[0] ?? "?",
      score: Number(sc.score ?? 0),
    }))
    .sort((a, b) => b.score - a.score);

  return (
    <div className="p-3 sm:p-6 space-y-5 max-w-6xl">
      <Link to="/assessments">
        <Button variant="ghost" size="sm" className="-ml-2">
          <ArrowLeft className="h-4 w-4 mr-1" /> All assessments
        </Button>
      </Link>

      <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6">
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="outline">{assessment.type}</Badge>
          <span className="text-xs text-muted-foreground">{session?.date}</span>
        </div>
        <h1 className="text-3xl font-bold">{subject?.name ?? "Assessment"}</h1>
        <p className="text-muted-foreground mt-1">{topic?.title ?? "No topic linked"}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={Target} label="Total Marks" value={assessment.total_marks ?? "—"} />
        <StatCard icon={TrendingUp} label="Average Score" value={assessment.avg_score != null ? `${assessment.avg_score}%` : "—"} accent />
        <StatCard icon={CheckCircle2} label="Completion" value={assessment.completion_rate != null ? `${assessment.completion_rate}%` : "—"} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-5">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" /> Student Scores
          </h3>
          {chartData.length ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} />
                  <Tooltip contentStyle={{ background: "rgba(0,0,0,0.9)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }} />
                  <Bar dataKey="score" fill="#3B7FEB" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">No individual scores recorded.</p>
          )}
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-5 space-y-3">
          <h3 className="font-semibold mb-1">Details</h3>
          <Row icon={Calendar} label="Date" value={session?.date ?? "—"} />
          <Row icon={BookOpen} label="Subject" value={subject?.name ?? "—"} />
          <Row icon={FileText} label="Topic" value={topic?.title ?? "—"} />
          {assessment.notes && (
            <div className="pt-2 border-t border-white/10">
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Notes</p>
              <p className="text-sm">{assessment.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, accent }: any) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-5">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
        <Icon className="h-3.5 w-3.5" /> {label}
      </div>
      <div className={`text-3xl font-bold mt-2 ${accent ? "text-primary" : ""}`}>{value}</div>
    </div>
  );
}

function Row({ icon: Icon, label, value }: any) {
  return (
    <div className="flex items-start gap-2 text-sm">
      <Icon className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
      <div>
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="font-medium">{value}</div>
      </div>
    </div>
  );
}
