import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Check, X, Download, FileText, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useStudents, useAttendance } from "@/hooks/useAttendance";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { exportAttendanceCSV, exportAttendancePDF } from "@/lib/exportHelpers";
import type { Session, Subject } from "@/types";
import { toast } from "sonner";

export function AttendanceTable() {
  const [params, setParams] = useSearchParams();
  const qc = useQueryClient();
  const { data: students = [] } = useStudents();

  const { data: sessionList = [] } = useQuery({
    queryKey: ["sessions-with-subjects"],
    queryFn: async () => {
      const [s, sub] = await Promise.all([
        supabase.from("sessions").select("*").order("date", { ascending: false }),
        supabase.from("subjects").select("*"),
      ]);
      const subjects = (sub.data ?? []) as Subject[];
      return ((s.data ?? []) as Session[]).map((session) => ({
        session,
        subject: subjects.find((x) => x.id === session.subject_id)!,
      }));
    },
  });

  const initial = params.get("session");
  const [selectedId, setSelectedId] = useState<string | null>(initial);

  useEffect(() => {
    if (!selectedId && sessionList.length) {
      setSelectedId(sessionList[0].session.id);
    }
  }, [sessionList, selectedId]);

  const { data: attendance = [] } = useAttendance(selectedId);
  const selected = sessionList.find((x) => x.session.id === selectedId);

  const map = useMemo(() => new Map(attendance.map((a) => [a.student_id, a])), [attendance]);
  const presentCount = useMemo(
    () => students.filter((s) => map.get(s.id)?.status === "present").length,
    [students, map]
  );

  const toggle = async (studentId: string) => {
    if (!selectedId) return;
    const existing = map.get(studentId);
    const newStatus = existing?.status === "present" ? "absent" : "present";
    if (existing) {
      await supabase.from("attendance").update({ status: newStatus }).eq("id", existing.id);
    } else {
      await supabase
        .from("attendance")
        .insert({ session_id: selectedId, student_id: studentId, status: newStatus });
    }
    qc.invalidateQueries({ queryKey: ["attendance", selectedId] });
  };

  const bulk = async (status: "present" | "absent") => {
    if (!selectedId) return;
    await supabase.from("attendance").delete().eq("session_id", selectedId);
    await supabase.from("attendance").insert(
      students.map((s) => ({ session_id: selectedId, student_id: s.id, status }))
    );
    qc.invalidateQueries({ queryKey: ["attendance", selectedId] });
    toast.success(`Marked all ${status}`);
  };

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Users className="h-6 w-6 text-primary" /> Attendance
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Mark and export attendance per session
        </p>
      </div>

      <div className="neo-card p-4 flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[280px]">
          <Select
            value={selectedId ?? ""}
            onValueChange={(v) => {
              setSelectedId(v);
              setParams({ session: v });
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Choose a session" />
            </SelectTrigger>
            <SelectContent>
              {sessionList.map(({ session, subject }) => (
                <SelectItem key={session.id} value={session.id}>
                  {session.date} · {subject?.name} · {session.start_time.slice(0, 5)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" onClick={() => bulk("present")}>
          <Check className="h-4 w-4 mr-1" /> All Present
        </Button>
        <Button variant="outline" onClick={() => bulk("absent")}>
          <X className="h-4 w-4 mr-1" /> All Absent
        </Button>
        <Button
          variant="outline"
          onClick={() =>
            selected &&
            exportAttendanceCSV(students, attendance, selected.subject.name, selected.session.date)
          }
        >
          <Download className="h-4 w-4 mr-1" /> CSV
        </Button>
        <Button
          className="gradient-primary text-primary-foreground border-0"
          onClick={() =>
            selected &&
            exportAttendancePDF(students, attendance, selected.subject.name, selected.session.date)
          }
        >
          <FileText className="h-4 w-4 mr-1" /> PDF
        </Button>
      </div>

      <div className="neo-card overflow-hidden">
        <div className="grid grid-cols-[100px_1fr_140px] bg-secondary/50 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <div>Roll No</div>
          <div>Name</div>
          <div className="text-center">Status</div>
        </div>
        <div className="divide-y divide-border max-h-[60vh] overflow-y-auto">
          {students.map((s) => {
            const status = map.get(s.id)?.status ?? "absent";
            const isPresent = status === "present";
            return (
              <div
                key={s.id}
                className="grid grid-cols-[100px_1fr_140px] px-4 py-3 items-center hover:bg-secondary/30 transition-colors"
              >
                <div className="font-mono text-sm text-muted-foreground">{s.roll_number}</div>
                <div className="font-medium text-sm">{s.full_name}</div>
                <div className="flex justify-center">
                  <motion.button
                    whileTap={{ scale: 0.92 }}
                    onClick={() => toggle(s.id)}
                    className={cn(
                      "px-4 py-1.5 rounded-full text-xs font-semibold border transition-all",
                      isPresent
                        ? "bg-success text-success-foreground border-success"
                        : "bg-destructive text-destructive-foreground border-destructive"
                    )}
                  >
                    {isPresent ? "Present" : "Absent"}
                  </motion.button>
                </div>
              </div>
            );
          })}
        </div>
        <div className="px-4 py-3 bg-secondary/40 border-t border-border flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Total: {students.length}</span>
          <div className="flex gap-4">
            <span className="text-success font-semibold">Present: {presentCount}</span>
            <span className="text-destructive font-semibold">
              Absent: {students.length - presentCount}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
