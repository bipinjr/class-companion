import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Check, X, Download, FileText, Users, Percent, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useStudents, useAttendance } from "@/hooks/useAttendance";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { exportAttendanceCSV, exportAttendancePDF } from "@/lib/exportHelpers";
import type { Session, Subject, Attendance } from "@/types";
import { toast } from "sonner";

export function AttendanceTable() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
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
        session, subject: subjects.find((x) => x.id === session.subject_id)!,
      }));
    },
  });

  const initial = params.get("session");
  const [selectedId, setSelectedId] = useState<string | null>(initial);

  useEffect(() => {
    if (!selectedId && sessionList.length) setSelectedId(sessionList[0].session.id);
  }, [sessionList, selectedId]);

  const { data: attendance = [] } = useAttendance(selectedId);
  const selected = sessionList.find((x) => x.session.id === selectedId);
  const map = useMemo(() => new Map(attendance.map((a) => [a.student_id, a])), [attendance]);
  const presentCount = useMemo(
    () => students.filter((s) => map.get(s.id)?.status === "present").length,
    [students, map]
  );

  // Per-student attendance % across all sessions
  const { data: allAttendance = [] } = useQuery({
    queryKey: ["all-attendance"],
    queryFn: async () => {
      const { data } = await supabase.from("attendance").select("*");
      return (data ?? []) as Attendance[];
    },
  });

  const studentStats = useMemo(() => {
    const byStudent = new Map<string, { present: number; total: number }>();
    allAttendance.forEach((a) => {
      const cur = byStudent.get(a.student_id) ?? { present: 0, total: 0 };
      cur.total += 1;
      if (a.status === "present") cur.present += 1;
      byStudent.set(a.student_id, cur);
    });
    return byStudent;
  }, [allAttendance]);

  const toggle = async (studentId: string) => {
    if (!selectedId) return;
    const existing = map.get(studentId);
    const newStatus = existing?.status === "present" ? "absent" : "present";
    if (existing) {
      await supabase.from("attendance").update({ status: newStatus }).eq("id", existing.id);
    } else {
      await supabase.from("attendance").insert({ session_id: selectedId, student_id: studentId, status: newStatus });
    }
    qc.invalidateQueries({ queryKey: ["attendance", selectedId] });
    qc.invalidateQueries({ queryKey: ["all-attendance"] });
  };

  const bulk = async (status: "present" | "absent") => {
    if (!selectedId) return;
    await supabase.from("attendance").delete().eq("session_id", selectedId);
    await supabase.from("attendance").insert(
      students.map((s) => ({ session_id: selectedId, student_id: s.id, status }))
    );
    qc.invalidateQueries({ queryKey: ["attendance", selectedId] });
    qc.invalidateQueries({ queryKey: ["all-attendance"] });
    toast.success(`Marked all ${status}`);
  };

  const classAvg = useMemo(() => {
    let p = 0, t = 0;
    studentStats.forEach((v) => { p += v.present; t += v.total; });
    return t ? Math.round((p / t) * 100) : 0;
  }, [studentStats]);

  return (
    <div className="p-3 sm:p-6 space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Users className="h-6 w-6 text-primary" /> Attendance
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">Mark attendance, view history per student</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Stat icon={Users} label="Students" value={students.length} />
        <Stat icon={Check} label="Sessions Logged" value={new Set(allAttendance.map((a) => a.session_id)).size} />
        <Stat icon={Percent} label="Class Attendance" value={`${classAvg}%`} accent />
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-4 flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[280px]">
          <Select value={selectedId ?? ""} onValueChange={(v) => { setSelectedId(v); setParams({ session: v }); }}>
            <SelectTrigger><SelectValue placeholder="Choose a session" /></SelectTrigger>
            <SelectContent>
              {sessionList.map(({ session, subject }) => (
                <SelectItem key={session.id} value={session.id}>
                  {session.date} · {subject?.name} · {session.start_time.slice(0, 5)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" onClick={() => bulk("present")}><Check className="h-4 w-4 mr-1" /> All Present</Button>
        <Button variant="outline" onClick={() => bulk("absent")}><X className="h-4 w-4 mr-1" /> All Absent</Button>
        <Button variant="outline" onClick={() => selected && exportAttendanceCSV(students, attendance, selected.subject.name, selected.session.date)}>
          <Download className="h-4 w-4 mr-1" /> CSV
        </Button>
        <Button className="bg-primary text-primary-foreground" onClick={() => selected && exportAttendancePDF(students, attendance, selected.subject.name, selected.session.date)}>
          <FileText className="h-4 w-4 mr-1" /> PDF
        </Button>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden">
        <div className="hidden sm:grid grid-cols-[100px_1fr_120px_140px_30px] bg-white/5 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <div>Roll No</div><div>Name</div><div className="text-center">Overall %</div><div className="text-center">This Session</div><div></div>
        </div>
        <div className="divide-y divide-white/10 max-h-[60vh] overflow-y-auto">
          {students.map((s) => {
            const status = map.get(s.id)?.status ?? "absent";
            const isPresent = status === "present";
            const stat = studentStats.get(s.id);
            const pct = stat && stat.total ? Math.round((stat.present / stat.total) * 100) : 0;
            return (
              <div key={s.id} className="flex sm:grid sm:grid-cols-[100px_1fr_120px_140px_30px] flex-wrap items-center gap-2 sm:gap-0 px-3 sm:px-4 py-3 hover:bg-white/10 transition-colors">
                <button type="button" onClick={() => navigate(`/attendance/student/${s.id}`)} className="font-mono text-xs sm:text-sm text-muted-foreground text-left hover:text-primary w-[60px] sm:w-auto">{s.roll_number}</button>
                <button type="button" onClick={() => navigate(`/attendance/student/${s.id}`)} className="font-medium text-sm text-left hover:text-primary flex-1 min-w-0 truncate">{s.full_name}</button>
                <div className="text-center text-sm font-semibold text-primary w-[60px] sm:w-auto">{stat ? `${pct}%` : "—"}</div>
                <div className="flex justify-center">
                  <motion.button
                    whileTap={{ scale: 0.92 }}
                    onClick={() => toggle(s.id)}
                    className={cn(
                      "px-3 sm:px-4 py-1.5 rounded-full text-xs font-semibold border transition-all",
                      isPresent
                        ? "bg-emerald-500 text-white border-emerald-500"
                        : "bg-red-500 text-white border-red-500"
                    )}
                  >
                    {isPresent ? "Present" : "Absent"}
                  </motion.button>
                </div>
                <button type="button" onClick={() => navigate(`/attendance/student/${s.id}`)} className="hidden sm:flex justify-end">
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
            );
          })}
        </div>
        <div className="px-4 py-3 bg-white/5 border-t border-white/10 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Total: {students.length}</span>
          <div className="flex gap-4">
            <span className="text-emerald-400 font-semibold">Present: {presentCount}</span>
            <span className="text-red-400 font-semibold">Absent: {students.length - presentCount}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value, accent }: any) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-5">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
        <Icon className="h-3.5 w-3.5" /> {label}
      </div>
      <div className={`text-3xl font-bold mt-2 ${accent ? "text-primary" : ""}`}>{value}</div>
    </div>
  );
}
