import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { FileText, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Subject, SubjectTemplate } from "@/types";

export function TemplateManager() {
  const navigate = useNavigate();

  const { data } = useQuery({
    queryKey: ["templates-all"],
    queryFn: async () => {
      const [s, t] = await Promise.all([
        supabase.from("subjects").select("*").order("name"),
        supabase.from("subject_templates").select("*").order("sort_order"),
      ]);
      return {
        subjects: (s.data ?? []) as Subject[],
        templates: (t.data ?? []) as SubjectTemplate[],
      };
    },
  });

  const subjects = data?.subjects ?? [];
  const templates = data?.templates ?? [];
  const countBySubject = (id: string) => templates.filter((t) => t.subject_id === id).length;
  const chaptersBySubject = (id: string) =>
    new Set(templates.filter((t) => t.subject_id === id).map((t) => t.chapter_number)).size;

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <FileText className="h-6 w-6 text-primary" /> Subject Templates
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">Pick a subject to manage its chapter & topic template</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {subjects.map((s) => (
          <button
            type="button"
            key={s.id}
            onClick={() => navigate(`/templates/${s.id}`)}
            className="text-left rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-5 hover:bg-white/10 hover:border-white/20 transition-colors group"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-base">{s.name}</h3>
                {s.language_type && <p className="text-xs text-muted-foreground mt-0.5">{s.language_type}</p>}
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            <div className="grid grid-cols-2 gap-3 mt-4">
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider">Chapters</div>
                <div className="text-xl font-bold mt-1">{chaptersBySubject(s.id)}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider">Entries</div>
                <div className="text-xl font-bold mt-1 text-primary">{countBySubject(s.id)}</div>
              </div>
            </div>
          </button>
        ))}
        {subjects.length === 0 && (
          <p className="text-sm text-muted-foreground italic col-span-full">No subjects yet.</p>
        )}
      </div>
    </div>
  );
}
