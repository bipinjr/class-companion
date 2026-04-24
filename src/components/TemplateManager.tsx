import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { FileText, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import type { Subject, SubjectTemplate } from "@/types";

export function TemplateManager() {
  const qc = useQueryClient();
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [newChapter, setNewChapter] = useState("");
  const [newTitle, setNewTitle] = useState("");

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
  const activeId = selectedSubject || subjects[0]?.id || "";
  const templates = (data?.templates ?? []).filter((t) => t.subject_id === activeId);

  const addEntry = async () => {
    if (!newChapter.trim() || !newTitle.trim() || !activeId) return;
    const maxOrder = templates.reduce((m, t) => Math.max(m, t.sort_order), 0);
    const { error } = await supabase.from("subject_templates").insert({
      subject_id: activeId,
      chapter_number: newChapter.trim(),
      topic_title: newTitle.trim(),
      sort_order: maxOrder + 1,
    });
    if (error) return toast.error(error.message);
    setNewChapter("");
    setNewTitle("");
    qc.invalidateQueries({ queryKey: ["templates-all"] });
    toast.success("Template entry added");
  };

  const removeEntry = async (id: string) => {
    await supabase.from("subject_templates").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["templates-all"] });
  };

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <FileText className="h-6 w-6 text-primary" /> Subject Templates
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Default chapter/topic structures used to populate sessions quickly
        </p>
      </div>

      <div className="neo-card p-4">
        <Select value={activeId} onValueChange={setSelectedSubject}>
          <SelectTrigger className="w-full sm:w-[320px]">
            <SelectValue placeholder="Choose a subject" />
          </SelectTrigger>
          <SelectContent>
            {subjects.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="neo-card overflow-hidden">
        <div className="grid grid-cols-[100px_1fr_60px] bg-secondary/50 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <div>Chapter</div>
          <div>Topic Title</div>
          <div></div>
        </div>
        <div className="divide-y divide-border">
          {templates.map((t) => (
            <div key={t.id} className="grid grid-cols-[100px_1fr_60px] px-4 py-3 items-center text-sm">
              <div className="font-mono text-muted-foreground">Ch {t.chapter_number}</div>
              <div className="font-medium">{t.topic_title}</div>
              <div className="flex justify-end">
                <Button variant="ghost" size="icon" onClick={() => removeEntry(t.id)}>
                  <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                </Button>
              </div>
            </div>
          ))}
          {templates.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground italic">
              No template entries yet
            </div>
          )}
        </div>
        <div className="grid grid-cols-[100px_1fr_60px] gap-2 p-4 border-t border-border bg-secondary/30">
          <Input
            placeholder="Ch #"
            value={newChapter}
            onChange={(e) => setNewChapter(e.target.value)}
          />
          <Input
            placeholder="New topic title"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addEntry()}
          />
          <Button onClick={addEntry} className="gradient-primary text-primary-foreground border-0">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
