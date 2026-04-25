export type TopicStatus = "not_started" | "in_progress" | "completed";
export type AttendanceStatus = "present" | "absent";
export type AssessmentType = "Quiz" | "Assignment" | "Test";

export interface Student {
  id: string;
  roll_number: string;
  full_name: string;
}

export interface Subject {
  id: string;
  name: string;
  language_type: string | null;
}

export interface Week {
  id: string;
  start_date: string;
  end_date: string;
  label: string;
}

export interface Session {
  id: string;
  week_id: string;
  subject_id: string;
  date: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
}

export interface Topic {
  id: string;
  session_id: string;
  chapter_number: string | null;
  part_number: number | null;
  title: string;
  notes: string | null;
  status: TopicStatus;
}

export interface Attendance {
  id: string;
  session_id: string;
  student_id: string;
  status: AttendanceStatus;
}

export interface Attachment {
  id: string;
  topic_id: string;
  file_url: string;
  file_name: string;
  description: string | null;
  uploaded_at: string;
}

export interface Assessment {
  id: string;
  session_id: string;
  type: AssessmentType;
  avg_score: number | null;
  completion_rate: number | null;
  total_marks: number | null;
  notes: string | null;
}

export interface AssessmentScore {
  id: string;
  assessment_id: string;
  student_id: string;
  score: number | null;
}

export interface SubjectTemplate {
  id: string;
  subject_id: string;
  chapter_number: string;
  topic_title: string;
  notes: string | null;
  sort_order: number;
}

export interface SessionWithDetails extends Session {
  subject: Subject;
  topic: Topic | null;
  assessment: Assessment | null;
  attachment_count: number;
}
