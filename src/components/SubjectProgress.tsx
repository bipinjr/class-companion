import { useQueryClient } from "@tanstack/react-query";
import { useTopicsBySubject } from "@/hooks/useTopics";
import { TrendingUp, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const STATUS_COLORS: Record<string, string> = {
  not_started: "bg-status-not-started/15 text-status-not-started border-status-not-started/30",
  in_progress: "bg-status-in-progress/15 text-status-in-progress border-status-in-progress/30",
  completed: "bg-status-completed/15 text-status-completed border-status-completed/30",
};

export function SubjectProgress() {
  const { data: groups = [] } = useTopicsBySubject();
  const qc = useQueryClient();

  const completeChapter = async (topicIds: string[]) => {
    if (!topicIds.length) return;
    await supabase.from("topics").update({ status: "completed" }).in("id", topicIds);
    qc.invalidateQueries({ queryKey: ["topics-by-subject"] });
    qc.invalidateQueries({ queryKey: ["plan"] });
    toast.success("Chapter marked as completed");
  };

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <TrendingUp className="h-6 w-6 text-primary" /> Subject Progress
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Syllabus coverage and chapter completion
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {groups.map(({ subject, topics, pct, completed, total }) => {
          // group topics by chapter
          const chapters = new Map<string, typeof topics>();
          topics.forEach((t) => {
            const k = t.chapter_number ?? "—";
            chapters.set(k, [...(chapters.get(k) ?? []), t]);
          });
          return (
            <div key={subject.id} className="neo-card p-5 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-bold text-lg">{subject.name}</h3>
                  {subject.language_type && (
                    <p className="text-xs text-muted-foreground">{subject.language_type}</p>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-primary">{pct}%</div>
                  <div className="text-xs text-muted-foreground">
                    {completed}/{total} topics
                  </div>
                </div>
              </div>
              <Progress value={pct} className="h-2" />

              <div className="space-y-2">
                {[...chapters.entries()].map(([ch, ts]) => {
                  const allDone = ts.every((t) => t.status === "completed");
                  const anyProg = ts.some((t) => t.status === "in_progress");
                  const chapterStatus = allDone ? "completed" : anyProg ? "in_progress" : "not_started";
                  return (
                    <div
                      key={ch}
                      className="flex items-center justify-between gap-2 p-3 rounded-xl bg-secondary/40"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">Chapter {ch}</span>
                          <Badge
                            variant="outline"
                            className={cn("text-[10px]", STATUS_COLORS[chapterStatus])}
                          >
                            {chapterStatus === "completed"
                              ? "Done"
                              : chapterStatus === "in_progress"
                              ? "In Progress"
                              : "Planned"}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                          {ts.map((t) => t.title).join(" · ")}
                        </p>
                      </div>
                      {!allDone && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => completeChapter(ts.map((t) => t.id))}
                        >
                          <CheckCircle2 className="h-4 w-4 mr-1 text-success" /> Mark done
                        </Button>
                      )}
                    </div>
                  );
                })}
                {chapters.size === 0 && (
                  <p className="text-xs text-muted-foreground italic">No topics scheduled yet</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
