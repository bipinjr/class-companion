import { useParams, Link } from "react-router-dom";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Plus, Trash2, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import type { Subject, SubjectTemplate } from "@/types";

export default function TemplateSubjectDetail() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const [newChapter, setNewChapter] = useState("");
  const [newTitle, setNewTitle] = useState("");

  const { data } = useQuery({
    queryKey: ["template-subject", id],
    enabled: !!id,
    queryFn: async () => {
      const [s, t] = await Promise.all([
        supabase.from("subjects").select("*").eq("id", id!).maybeSingle(),
        supabase.from("subject_templates").select("*").eq("subject_id", id!).order("sort_order"),
      ]);
      return { subject: s.data as Subject | null, templates: (t.data ?? []) as SubjectTemplate[] };
    },
  });

  const templates = data?.templates ?? [];
  const subject = data?.subject;

  const addEntry = async () => {
    if (!newChapter.trim() || !newTitle.trim() || !id) return;
    const maxOrder = templates.reduce((m, t) => Math.max(m, t.sort_order), 0);
    const { error } = await supabase.from("subject_templates").insert({
      subject_id: id,
      chapter_number: newChapter.trim(),
      topic_title: newTitle.trim(),
      sort_order: maxOrder + 1,
    });
    if (error) return toast.error(error.message);
    setNewChapter(""); setNewTitle("");
    qc.invalidateQueries({ queryKey: ["template-subject", id] });
    toast.success("Entry added");
  };

  const remove = async (tid: string) => {
    await supabase.from("subject_templates").delete().eq("id", tid);
    qc.invalidateQueries({ queryKey: ["template-subject", id] });
  };

  return (
    <div className="p-6 space-y-5 max-w-4xl">
      <Link to="/templates">
        <Button variant="ghost" size="sm" className="-ml-2">
          <ArrowLeft className="h-4 w-4 mr-1" /> All templates
        </Button>
      </Link>

      <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <FileText className="h-4 w-4" /> Template
        </div>
        <h1 className="text-2xl font-bold mt-1">{subject?.name ?? "Subject"}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {templates.length} chapter entries · used to seed sessions
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden">
        <div className="grid grid-cols-[100px_1fr_60px] bg-white/5 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <div>Chapter</div><div>Topic Title</div><div></div>
        </div>
        <div className="divide-y divide-white/10">
          {templates.map((t) => (
            <div key={t.id} className="grid grid-cols-[100px_1fr_60px] px-4 py-3 items-center text-sm">
              <div className="font-mono text-muted-foreground">Ch {t.chapter_number}</div>
              <div className="font-medium">{t.topic_title}</div>
              <div className="flex justify-end">
                <Button variant="ghost" size="icon" onClick={() => remove(t.id)}>
                  <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                </Button>
              </div>
            </div>
          ))}
          {templates.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground italic">No entries yet</div>
          )}
        </div>
        <div className="grid grid-cols-[100px_1fr_60px] gap-2 p-4 border-t border-white/10 bg-white/5">
          <Input placeholder="Ch #" value={newChapter} onChange={(e) => setNewChapter(e.target.value)} />
          <Input
            placeholder="New topic title"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addEntry()}
          />
          <Button onClick={addEntry} className="bg-primary text-primary-foreground">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
