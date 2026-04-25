import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { X, Upload, Paperclip, Save, Users, Trash2, BarChart3 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import type { Topic, Attachment, Assessment, Subject, Session, Student, AssessmentScore } from "@/types";

interface Props {
  sessionId: string | null;
  onClose: () => void;
}

export function SessionDrawer({ sessionId, onClose }: Props) {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data } = useQuery({
    queryKey: ["session-full", sessionId],
    queryFn: async () => {
      if (!sessionId) return null;
      const [sess, subj, top, att, asm, students] = await Promise.all([
        supabase.from("sessions").select("*").eq("id", sessionId).single(),
        supabase.from("subjects").select("*"),
        supabase.from("topics").select("*").eq("session_id", sessionId).maybeSingle(),
        supabase.from("attachments").select("*"),
        supabase.from("assessments").select("*").eq("session_id", sessionId).maybeSingle(),
        supabase.from("students").select("*").order("roll_number"),
      ]);
      const session = sess.data as Session;
      const subjects = (subj.data ?? []) as Subject[];
      const subject = subjects.find((s) => s.id === session.subject_id)!;
      let topic = top.data as Topic | null;
      let attachments: Attachment[] = [];
      if (topic) {
        attachments = ((att.data ?? []) as Attachment[]).filter(
          (a) => a.topic_id === topic!.id
        );
      }
      const assessment = asm.data as Assessment | null;
      let scores: AssessmentScore[] = [];
      if (assessment) {
        const { data: sc } = await supabase
          .from("assessment_scores")
          .select("*")
          .eq("assessment_id", assessment.id);
        scores = (sc ?? []) as AssessmentScore[];
      }
      // Auto-suggest part N+1 if same chapter used previous day for this subject
      let suggestedPart: number | null = null;
      if (!topic) {
        const { data: prevSessions } = await supabase
          .from("sessions")
          .select("id, date")
          .eq("subject_id", session.subject_id)
          .lt("date", session.date)
          .order("date", { ascending: false })
          .limit(1);
        if (prevSessions?.[0]) {
          const { data: prevTopic } = await supabase
            .from("topics")
            .select("*")
            .eq("session_id", prevSessions[0].id)
            .maybeSingle();
          if (prevTopic) {
            suggestedPart = (prevTopic.part_number ?? 0) + 1;
          }
        }
      }
      return {
        session,
        subject,
        topic,
        attachments,
        assessment,
        scores,
        students: (students.data ?? []) as Student[],
        suggestedPart,
      };
    },
    enabled: !!sessionId,
  });

  const [chapter, setChapter] = useState("");
  const [part, setPart] = useState("");
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<Topic["status"]>("not_started");
  const [asmType, setAsmType] = useState<Assessment["type"] | "">("");
  const [asmAvg, setAsmAvg] = useState("");
  const [asmRate, setAsmRate] = useState("");
  const [asmNotes, setAsmNotes] = useState("");
  const [uploading, setUploading] = useState(false);
  const [fileDesc, setFileDesc] = useState("");

  useEffect(() => {
    if (!data) return;
    setChapter(data.topic?.chapter_number ?? "");
    setPart(
      data.topic?.part_number?.toString() ?? data.suggestedPart?.toString() ?? ""
    );
    setTitle(data.topic?.title ?? "");
    setNotes(data.topic?.notes ?? "");
    setStatus(data.topic?.status ?? "not_started");
    setAsmType(data.assessment?.type ?? "");
    setAsmAvg(data.assessment?.avg_score?.toString() ?? "");
    setAsmRate(data.assessment?.completion_rate?.toString() ?? "");
    setAsmNotes(data.assessment?.notes ?? "");
  }, [data]);

  const save = async () => {
    if (!data) return;
    if (!title.trim()) {
      toast.error("Topic title is required");
      return;
    }
    const topicPayload = {
      session_id: data.session.id,
      chapter_number: chapter || null,
      part_number: part ? parseInt(part) : null,
      title: title.trim(),
      notes: notes || null,
      status,
    };
    let topicId = data.topic?.id;
    if (data.topic) {
      const { error } = await supabase.from("topics").update(topicPayload).eq("id", data.topic.id);
      if (error) return toast.error(error.message);
    } else {
      const { data: ins, error } = await supabase
        .from("topics")
        .insert(topicPayload)
        .select()
        .single();
      if (error) return toast.error(error.message);
      topicId = ins.id;
    }

    // Assessment
    if (asmType) {
      const asmPayload = {
        session_id: data.session.id,
        type: asmType as Assessment["type"],
        avg_score: asmAvg ? parseFloat(asmAvg) : null,
        completion_rate: asmRate ? parseFloat(asmRate) : null,
        notes: asmNotes || null,
      };
      if (data.assessment) {
        await supabase.from("assessments").update(asmPayload).eq("id", data.assessment.id);
      } else {
        await supabase.from("assessments").insert(asmPayload);
      }
    } else if (data.assessment) {
      await supabase.from("assessments").delete().eq("id", data.assessment.id);
    }

    toast.success("Session saved");
    qc.invalidateQueries({ queryKey: ["plan"] });
    qc.invalidateQueries({ queryKey: ["session-full", sessionId] });
    qc.invalidateQueries({ queryKey: ["topics-by-subject"] });
    qc.invalidateQueries({ queryKey: ["assessments-log"] });
  };

  const handleUpload = async (file: File) => {
    if (!data?.topic) {
      toast.error("Save the topic first before uploading attachments");
      return;
    }
    setUploading(true);
    const path = `${data.topic.id}/${Date.now()}_${file.name}`;
    const { error: upErr } = await supabase.storage.from("attachments").upload(path, file);
    if (upErr) {
      toast.error(upErr.message);
      setUploading(false);
      return;
    }
    const { data: urlData } = supabase.storage.from("attachments").getPublicUrl(path);
    const { error: dbErr } = await supabase.from("attachments").insert({
      topic_id: data.topic.id,
      file_url: urlData.publicUrl,
      file_name: file.name,
      description: fileDesc || null,
    });
    setUploading(false);
    if (dbErr) return toast.error(dbErr.message);
    setFileDesc("");
    toast.success("Attachment uploaded");
    qc.invalidateQueries({ queryKey: ["session-full", sessionId] });
    qc.invalidateQueries({ queryKey: ["plan"] });
  };

  const removeAttachment = async (id: string) => {
    await supabase.from("attachments").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["session-full", sessionId] });
    qc.invalidateQueries({ queryKey: ["plan"] });
    toast.success("Attachment removed");
  };

  return (
    <AnimatePresence>
      {sessionId && data && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-foreground/40 backdrop-blur-sm z-40"
          />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 220 }}
            className="fixed top-0 right-0 h-full w-full sm:w-[480px] bg-card border-l border-border z-50 overflow-y-auto"
          >
            <div className="sticky top-0 bg-card/95 backdrop-blur z-10 border-b border-border px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold">{data.subject.name}</h2>
                <p className="text-xs text-muted-foreground">
                  {data.session.day_of_week} · {data.session.date} ·{" "}
                  {data.session.start_time.slice(0, 5)}–{data.session.end_time.slice(0, 5)}
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Chapter</Label>
                  <Input value={chapter} onChange={(e) => setChapter(e.target.value)} placeholder="e.g. 2" />
                </div>
                <div>
                  <Label>Part (optional)</Label>
                  <Input
                    value={part}
                    onChange={(e) => setPart(e.target.value)}
                    placeholder={data.suggestedPart ? `Suggested: ${data.suggestedPart}` : ""}
                  />
                </div>
              </div>
              <div>
                <Label>Topic Title</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What did you teach?" />
              </div>
              <div>
                <Label>Notes</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Quick notes for next time…"
                />
              </div>
              <div>
                <Label>Status</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as Topic["status"])}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="not_started">Not Started</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              {/* Attachments */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Paperclip className="h-4 w-4 text-accent" /> Attachments
                </h3>
                <div className="flex flex-wrap gap-2 mb-3">
                  {data.attachments.map((a) => (
                    <motion.div
                      key={a.id}
                      whileHover={{ y: -2 }}
                      className="inline-flex items-center gap-2 bg-accent/10 text-accent border border-accent/30 rounded-full px-3 py-1.5 text-xs"
                    >
                      <Paperclip className="h-3 w-3" />
                      <a href={a.file_url} target="_blank" rel="noreferrer" className="font-medium hover:underline">
                        {a.file_name}
                      </a>
                      {a.description && <span className="text-muted-foreground">· {a.description}</span>}
                      <button onClick={() => removeAttachment(a.id)} className="hover:text-destructive">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </motion.div>
                  ))}
                  {data.attachments.length === 0 && (
                    <p className="text-xs text-muted-foreground italic">No attachments yet</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Input
                    placeholder="Description (optional)"
                    value={fileDesc}
                    onChange={(e) => setFileDesc(e.target.value)}
                  />
                  <label className="flex items-center justify-center gap-2 border border-dashed border-border rounded-xl py-3 cursor-pointer hover:bg-secondary/50 transition-colors">
                    <Upload className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {uploading ? "Uploading…" : "Upload file"}
                    </span>
                    <input
                      type="file"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleUpload(f);
                        e.target.value = "";
                      }}
                    />
                  </label>
                </div>
              </div>

              <Separator />

              {/* Assessment */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-primary" /> Assessment (optional)
                </h3>
                <div className="space-y-3">
                  <Select value={asmType} onValueChange={(v) => setAsmType(v as any)}>
                    <SelectTrigger>
                      <SelectValue placeholder="No assessment" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Quiz">Quiz</SelectItem>
                      <SelectItem value="Assignment">Assignment</SelectItem>
                      <SelectItem value="Test">Test</SelectItem>
                    </SelectContent>
                  </Select>
                  {asmType && (
                    <>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label>Avg Score (%)</Label>
                          <Input type="number" value={asmAvg} onChange={(e) => setAsmAvg(e.target.value)} />
                        </div>
                        <div>
                          <Label>Completion (%)</Label>
                          <Input type="number" value={asmRate} onChange={(e) => setAsmRate(e.target.value)} />
                        </div>
                      </div>
                      <Textarea
                        placeholder="Assessment notes"
                        value={asmNotes}
                        onChange={(e) => setAsmNotes(e.target.value)}
                        rows={2}
                      />
                    </>
                  )}
                </div>
              </div>

              <Separator />

              <div className="flex flex-col sm:flex-row gap-2">
                <Button onClick={save} className="flex-1 gradient-primary text-primary-foreground border-0">
                  <Save className="h-4 w-4 mr-1" /> Save Session
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    onClose();
                    navigate(`/attendance?session=${data.session.id}`);
                  }}
                >
                  <Users className="h-4 w-4 mr-1" /> View Attendance
                </Button>
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
