import { motion } from "framer-motion";
import { X, FileText, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  exportWeekPDF,
  buildWeekTextSummary,
} from "@/lib/exportHelpers";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Session, Subject, Topic } from "@/types";

interface Props {
  weekLabel: string;
  subjects: Subject[];
  sessions: Session[];
  topics: Topic[];
  onClose: () => void;
}

export function ExportTools({ weekLabel, subjects, sessions, topics, onClose }: Props) {
  const handlePDF = async () => {
    const { data: attachments } = await supabase.from("attachments").select("*");
    const data = sessions.map((session) => {
      const subject = subjects.find((s) => s.id === session.subject_id)!;
      const topic = topics.find((t) => t.session_id === session.id) ?? null;
      const atts = topic
        ? (attachments ?? []).filter((a: any) => a.topic_id === topic.id)
        : [];
      return { session, subject, topic, attachments: atts as any };
    });
    exportWeekPDF(weekLabel, data);
    toast.success("PDF exported");
  };

  const handleCopy = async () => {
    const bySubject = subjects.map((subject) => {
      const sessIds = sessions.filter((s) => s.subject_id === subject.id).map((s) => s.id);
      const subjTopics = topics.filter((t) => sessIds.includes(t.session_id));
      return { subject, topics: subjTopics };
    });
    const text = buildWeekTextSummary(weekLabel, bySubject);
    await navigator.clipboard.writeText(text);
    toast.success("Summary copied to clipboard");
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-foreground/40 backdrop-blur-sm z-40"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 neo-card p-6 w-full max-w-md z-50 space-y-5"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Export Week</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">{weekLabel}</p>
        <div className="space-y-3">
          <Button
            onClick={handlePDF}
            className="w-full justify-start gradient-primary text-primary-foreground border-0 h-auto py-4"
          >
            <FileText className="h-5 w-5 mr-3" />
            <div className="text-left">
              <div className="font-semibold">Download PDF</div>
              <div className="text-xs opacity-90">Full timetable with attachments list</div>
            </div>
          </Button>
          <Button
            onClick={handleCopy}
            variant="outline"
            className="w-full justify-start h-auto py-4"
          >
            <Copy className="h-5 w-5 mr-3" />
            <div className="text-left">
              <div className="font-semibold">Copy Plain-Text Summary</div>
              <div className="text-xs text-muted-foreground">Ready to paste in WhatsApp/email</div>
            </div>
          </Button>
        </div>
      </motion.div>
    </>
  );
}
