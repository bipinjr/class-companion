import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Paperclip, BarChart3, Filter, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAllWeeks } from "@/hooks/useWeek";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { Subject, Session, Topic, Assessment, Attachment } from "@/types";
import { ExportTools } from "./ExportTools";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const TIME_SLOTS = ["09:00", "11:00", "14:00"];

const STATUS_STYLES: Record<string, string> = {
  not_started: "bg-status-not-started/10 text-status-not-started border-status-not-started/30",
  in_progress: "bg-status-in-progress/10 text-status-in-progress border-status-in-progress/30",
  completed: "bg-status-completed/10 text-status-completed border-status-completed/30",
};

const STATUS_LABEL: Record<string, string> = {
  not_started: "Not Started",
  in_progress: "In Progress",
  completed: "Completed",
};

export function WeeklyPlanner() {
  const { data: weeks = [] } = useAllWeeks();
  const navigate = useNavigate();
  const [weekIdx, setWeekIdx] = useState<number | null>(null);
  const [filterSubject, setFilterSubject] = useState<string>("all");
  const [showExport, setShowExport] = useState(false);

  // Default to current week (containing today) once weeks load
  const effectiveIdx = useMemo(() => {
    if (weekIdx !== null) return weekIdx;
    if (!weeks.length) return 0;
    const today = new Date().toISOString().slice(0, 10);
    const idx = weeks.findIndex((w) => w.start_date <= today && w.end_date >= today);
    return idx >= 0 ? idx : weeks.length - 1;
  }, [weekIdx, weeks]);

  const currentWeek = weeks[effectiveIdx];

  const { data: planData } = useQuery({
    queryKey: ["plan", currentWeek?.id],
    queryFn: async () => {
      if (!currentWeek) return null;
      const [subjectsRes, sessionsRes, topicsRes, assessmentsRes, attachmentsRes] =
        await Promise.all([
          supabase.from("subjects").select("*"),
          supabase.from("sessions").select("*").eq("week_id", currentWeek.id),
          supabase.from("topics").select("*"),
          supabase.from("assessments").select("*"),
          supabase.from("attachments").select("topic_id"),
        ]);
      return {
        subjects: (subjectsRes.data ?? []) as Subject[],
        sessions: (sessionsRes.data ?? []) as Session[],
        topics: (topicsRes.data ?? []) as Topic[],
        assessments: (assessmentsRes.data ?? []) as Assessment[],
        attachments: (attachmentsRes.data ?? []) as Attachment[],
      };
    },
    enabled: !!currentWeek,
  });

  const todayStr = new Date().toISOString().slice(0, 10);

  const cellMap = useMemo(() => {
    const map = new Map<string, any>();
    if (!planData) return map;
    const subById = new Map(planData.subjects.map((s) => [s.id, s]));
    const topicBySession = new Map<string, Topic>();
    planData.topics.forEach((t) => topicBySession.set(t.session_id, t));
    const assessBySession = new Map<string, Assessment>();
    planData.assessments.forEach((a) => assessBySession.set(a.session_id, a));
    const attachCount = new Map<string, number>();
    planData.attachments.forEach((a) => {
      const topic = planData.topics.find((t) => t.id === a.topic_id);
      if (topic) {
        attachCount.set(topic.session_id, (attachCount.get(topic.session_id) ?? 0) + 1);
      }
    });

    planData.sessions.forEach((s) => {
      const key = `${s.day_of_week}-${s.start_time.slice(0, 5)}`;
      map.set(key, {
        session: s,
        subject: subById.get(s.subject_id),
        topic: topicBySession.get(s.id),
        assessment: assessBySession.get(s.id),
        attachments: attachCount.get(s.id) ?? 0,
      });
    });
    return map;
  }, [planData]);

  // Subject progress for in-card progress bar
  const subjectProgress = useMemo(() => {
    const m = new Map<string, number>();
    if (!planData) return m;
    const bySubj = new Map<string, Topic[]>();
    planData.topics.forEach((t) => {
      const sess = planData.sessions.find((s) => s.id === t.session_id);
      if (!sess) return;
      const arr = bySubj.get(sess.subject_id) ?? [];
      arr.push(t);
      bySubj.set(sess.subject_id, arr);
    });
    bySubj.forEach((topics, subjId) => {
      const done = topics.filter((t) => t.status === "completed").length;
      m.set(subjId, topics.length ? Math.round((done / topics.length) * 100) : 0);
    });
    return m;
  }, [planData]);

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Weekly Planner</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {currentWeek?.label ?? "Loading…"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            disabled={effectiveIdx <= 0}
            onClick={() => setWeekIdx(effectiveIdx - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            disabled={effectiveIdx >= weeks.length - 1}
            onClick={() => setWeekIdx(effectiveIdx + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2 ml-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={filterSubject} onValueChange={setFilterSubject}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All subjects</SelectItem>
                {planData?.subjects.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={() => setShowExport(true)} className="gradient-primary text-primary-foreground border-0">
            <Download className="h-4 w-4 mr-1" /> Export
          </Button>
        </div>
      </div>

      {/* Grid */}
      <div className="rounded-2xl overflow-hidden border border-white/10 bg-black/20 backdrop-blur-md shadow-elevated">
        <div className="grid grid-cols-[80px_repeat(6,minmax(180px,1fr))] bg-white/5 backdrop-blur-sm">
          <div className="p-3 text-xs font-semibold text-muted-foreground border-r border-white/10">
            Time
          </div>
          {DAYS.map((day) => {
            const dayDate = currentWeek
              ? new Date(
                  new Date(currentWeek.start_date).getTime() +
                    DAYS.indexOf(day) * 86400000
                )
                  .toISOString()
                  .slice(0, 10)
              : "";
            const isToday = dayDate === todayStr;
            return (
              <div
                key={day}
                className={cn(
                  "p-3 text-center border-r border-white/10 last:border-r-0 transition-colors",
                  isToday && "bg-primary/15"
                )}
              >
                <div
                  className={cn(
                    "text-xs font-semibold uppercase tracking-wider",
                    isToday ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  {day.slice(0, 3)}
                </div>
                <div className="text-sm font-medium mt-0.5">{dayDate.slice(8)}</div>
                {isToday && (
                  <div className="text-[10px] text-primary font-bold mt-0.5">TODAY</div>
                )}
              </div>
            );
          })}
        </div>

        {TIME_SLOTS.map((time) => (
          <div
            key={time}
            className="grid grid-cols-[80px_repeat(6,minmax(180px,1fr))] border-t border-white/10 min-h-[140px]"
          >
            <div className="p-3 text-xs font-medium text-muted-foreground border-r border-white/10 bg-white/5 flex items-start">
              {time}
            </div>
            {DAYS.map((day) => {
              const cell = cellMap.get(`${day}-${time}`);
              if (!cell) {
                return (
                  <div
                    key={day + time}
                    className="border-r border-white/10 last:border-r-0 p-2"
                  />
                );
              }
              if (filterSubject !== "all" && cell.subject?.id !== filterSubject) {
                return (
                  <div
                    key={day + time}
                    className="border-r border-white/10 last:border-r-0 p-2 opacity-30"
                  />
                );
              }
              const isCompleted = cell.topic?.status === "completed";
              return (
                <div
                  key={day + time}
                  className="border-r border-white/10 last:border-r-0 p-2"
                >
                  <motion.button
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate(`/planner/${cell.session.id}`)}
                    className={cn(
                      "w-full text-left h-full rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 hover:border-white/20 transition-colors p-3 flex flex-col gap-1.5",
                      isCompleted && "opacity-60"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="text-xs font-bold text-foreground line-clamp-1">
                        {cell.subject?.name}
                      </div>
                      <div className="flex items-center gap-1">
                        {cell.attachments > 0 && (
                          <Paperclip className="h-3 w-3 text-accent" />
                        )}
                        {cell.assessment && (
                          <BarChart3 className="h-3 w-3 text-primary" />
                        )}
                      </div>
                    </div>
                    {/* Subject progress mini bar */}
                    <div className="h-1 w-full rounded-full bg-secondary overflow-hidden">
                      <div
                        className="h-full gradient-primary"
                        style={{ width: `${subjectProgress.get(cell.subject?.id ?? "") ?? 0}%` }}
                      />
                    </div>
                    {cell.topic ? (
                      <>
                        <p className="text-xs text-muted-foreground">
                          Ch {cell.topic.chapter_number}
                          {cell.topic.part_number ? ` · Pt ${cell.topic.part_number}` : ""}
                        </p>
                        <p className="text-xs font-medium line-clamp-2">{cell.topic.title}</p>
                      </>
                    ) : (
                      <p className="text-xs text-muted-foreground italic">No topic yet</p>
                    )}
                    <Badge
                      variant="outline"
                      className={cn(
                        "mt-auto text-[10px] py-0 px-2 border w-fit",
                        STATUS_STYLES[cell.topic?.status ?? "not_started"]
                      )}
                    >
                      {STATUS_LABEL[cell.topic?.status ?? "not_started"]}
                    </Badge>
                  </motion.button>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {showExport && currentWeek && planData && (
        <ExportTools
          weekLabel={currentWeek.label}
          subjects={planData.subjects}
          sessions={planData.sessions}
          topics={planData.topics}
          onClose={() => setShowExport(false)}
        />
      )}
    </div>
  );
}
