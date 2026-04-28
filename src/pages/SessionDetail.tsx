import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Calendar, Clock, BookOpen, Users, ClipboardList, Paperclip } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const STATUS_COLORS: Record<string, string> = {
  not_started: "border-slate-500/40 text-slate-400 bg-slate-500/10",
  in_progress: "border-amber-500/40 text-amber-400 bg-amber-500/10",
  completed: "border-emerald-500/40 text-emerald-400 bg-emerald-500/10",
};

export default function SessionDetail() {
  const { id } = useParams<{ id: string }>();

  const { data, isLoading } = useQuery({
    queryKey: ["session-detail", id],
    enabled: !!id,
    queryFn: async () => {
      const { data: s } = await supabase.from("sessions").select("*").eq("id", id!).maybeSingle();
      if (!s) return null;
      const [sub, top, ass, att, atts] = await Promise.all([
        supabase.from("subjects").select("*").eq("id", s.subject_id).maybeSingle(),
        supabase.from("topics").select("*").eq("session_id", s.id).maybeSingle(),
        supabase.from("assessments").select("*").eq("session_id", s.id).maybeSingle(),
        supabase.from("attendance").select("*").eq("session_id", s.id),
        supabase.from("students").select("*"),
      ]);
      const topic = top.data;
      const attachments = topic
        ? (await supabase.from("attachments").select("*").eq("topic_id", topic.id)).data ?? []
        : [];
      return {
        session: s,
        subject: sub.data,
        topic,
        assessment: ass.data,
        attendance: att.data ?? [],
        students: atts.data ?? [],
        attachments,
      };
    },
  });

  if (isLoading) return <div className="p-3 sm:p-6 text-muted-foreground">Loading…</div>;
  if (!data) return <div className="p-3 sm:p-6 text-muted-foreground">Session not found.</div>;

  const { session, subject, topic, assessment, attendance, students, attachments } = data;
  const present = attendance.filter((a: any) => a.status === "present").length;
  const studentMap = new Map(students.map((s: any) => [s.id, s]));

  return (
    <div className="p-3 sm:p-6 space-y-5 max-w-6xl">
      <Link to="/">
        <Button variant="ghost" size="sm" className="-ml-2">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to planner
        </Button>
      </Link>

      <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6">
        <div className="flex items-center gap-2 mb-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" /> {session.date} · {session.day_of_week}
          <Clock className="h-4 w-4 ml-2" /> {session.start_time.slice(0, 5)}–{session.end_time.slice(0, 5)}
        </div>
        <h1 className="text-3xl font-bold">{subject?.name ?? "Session"}</h1>
        {topic && (
          <div className="mt-3 flex items-center gap-2">
            <Badge variant="outline" className={STATUS_COLORS[topic.status]}>{topic.status.replace("_", " ")}</Badge>
            <span className="text-sm text-muted-foreground">Ch {topic.chapter_number ?? "—"}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-5">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-primary" /> Topic
          </h3>
          {topic ? (
            <>
              <p className="font-medium">{topic.title}</p>
              {topic.notes && <p className="text-sm text-muted-foreground mt-2">{topic.notes}</p>}
            </>
          ) : (
            <p className="text-sm text-muted-foreground italic">No topic linked.</p>
          )}
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-5">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" /> Attendance
          </h3>
          {attendance.length ? (
            <>
              <p className="text-2xl font-bold">{present}<span className="text-muted-foreground text-base">/{attendance.length} present</span></p>
              <Link to={`/attendance?session=${session.id}`} className="text-xs text-primary hover:underline mt-2 inline-block">
                Manage attendance →
              </Link>
            </>
          ) : (
            <p className="text-sm text-muted-foreground italic">Not marked yet.</p>
          )}
        </div>

        {assessment && (
          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-5">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-primary" /> Assessment
            </h3>
            <Badge variant="outline" className="mb-2">{assessment.type}</Badge>
            <div className="grid grid-cols-3 gap-2 text-sm">
              <div><div className="text-xs text-muted-foreground">Total</div><div className="font-semibold">{assessment.total_marks ?? "—"}</div></div>
              <div><div className="text-xs text-muted-foreground">Avg</div><div className="font-semibold text-primary">{assessment.avg_score != null ? `${assessment.avg_score}%` : "—"}</div></div>
              <div><div className="text-xs text-muted-foreground">Completion</div><div className="font-semibold">{assessment.completion_rate != null ? `${assessment.completion_rate}%` : "—"}</div></div>
            </div>
            <Link to={`/assessments/${assessment.id}`} className="text-xs text-primary hover:underline mt-3 inline-block">
              Open assessment →
            </Link>
          </div>
        )}

        {attachments.length > 0 && (
          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-5">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Paperclip className="h-4 w-4 text-primary" /> Attachments
            </h3>
            <ul className="space-y-1.5 text-sm">
              {attachments.map((a: any) => (
                <li key={a.id}>
                  <a href={a.file_url} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                    {a.file_name}
                  </a>
                  {a.description && <span className="text-muted-foreground"> — {a.description}</span>}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
