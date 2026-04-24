import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { Student, Attendance, Subject, Session, Topic, Attachment } from "@/types";

export function exportAttendanceCSV(
  students: Student[],
  attendance: Attendance[],
  subjectName: string,
  date: string
) {
  const map = new Map(attendance.map((a) => [a.student_id, a.status]));
  const rows = [["Roll No", "Name", "Status"]];
  students.forEach((s) => rows.push([s.roll_number, s.full_name, map.get(s.id) ?? "absent"]));
  const csv = rows.map((r) => r.map((x) => `"${x}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  triggerDownload(blob, `attendance_${slug(subjectName)}_${date}.csv`);
}

export function exportAttendancePDF(
  students: Student[],
  attendance: Attendance[],
  subjectName: string,
  date: string
) {
  const map = new Map(attendance.map((a) => [a.student_id, a.status]));
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text(`Attendance — ${subjectName}`, 14, 18);
  doc.setFontSize(11);
  doc.text(`Date: ${date}`, 14, 26);

  const present = students.filter((s) => map.get(s.id) === "present").length;
  doc.text(`Present: ${present} / ${students.length}`, 14, 32);

  autoTable(doc, {
    startY: 38,
    head: [["Roll No", "Name", "Status"]],
    body: students.map((s) => [s.roll_number, s.full_name, map.get(s.id) ?? "absent"]),
    theme: "striped",
    headStyles: { fillColor: [14, 165, 233] },
  });
  doc.save(`attendance_${slug(subjectName)}_${date}.pdf`);
}

export function exportWeekPDF(
  weekLabel: string,
  data: Array<{
    session: Session;
    subject: Subject;
    topic: Topic | null;
    attachments: Attachment[];
  }>
) {
  const doc = new jsPDF();
  doc.setFontSize(18);
  doc.text("Weekly Plan", 14, 18);
  doc.setFontSize(12);
  doc.text(weekLabel, 14, 26);

  const body = data.map(({ session, subject, topic, attachments }) => {
    const chapter = topic?.chapter_number
      ? `Ch ${topic.chapter_number}${topic.part_number ? ` Pt ${topic.part_number}` : ""}`
      : "—";
    const att = attachments.length ? attachments.map((a) => a.file_name).join(", ") : "—";
    return [
      session.day_of_week,
      `${session.start_time.slice(0, 5)}`,
      subject.name,
      chapter,
      topic?.title ?? "—",
      topic?.status ?? "—",
      att,
    ];
  });

  autoTable(doc, {
    startY: 32,
    head: [["Day", "Time", "Subject", "Chapter", "Topic", "Status", "Attachments"]],
    body,
    styles: { fontSize: 9, cellPadding: 2 },
    headStyles: { fillColor: [14, 165, 233] },
    columnStyles: { 6: { cellWidth: 40 } },
  });
  doc.save(`week_${slug(weekLabel)}.pdf`);
}

export function buildWeekTextSummary(
  weekLabel: string,
  bySubject: Array<{ subject: Subject; topics: Array<Topic> }>
) {
  const lines = [`Week of ${weekLabel}:`];
  bySubject.forEach(({ subject, topics }) => {
    if (!topics.length) return;
    const parts = topics
      .map((t) => {
        const ch = t.chapter_number ? `Chapter ${t.chapter_number}` : "";
        const pt = t.part_number ? ` (Part ${t.part_number})` : "";
        return `${ch}${pt} – ${t.title}`.trim();
      })
      .join(", ");
    lines.push(`• ${subject.name}: ${parts}`);
  });
  return lines.join("\n");
}

function slug(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
