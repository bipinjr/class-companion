-- Enums
CREATE TYPE topic_status AS ENUM ('not_started', 'in_progress', 'completed');
CREATE TYPE attendance_status AS ENUM ('present', 'absent');
CREATE TYPE assessment_type AS ENUM ('Quiz', 'Assignment', 'Test');

-- Tables
CREATE TABLE public.students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  roll_number TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  language_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.weeks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  label TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_id UUID NOT NULL REFERENCES public.weeks(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  day_of_week TEXT NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  chapter_number TEXT,
  part_number INT,
  title TEXT NOT NULL,
  notes TEXT,
  status topic_status NOT NULL DEFAULT 'not_started',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  status attendance_status NOT NULL DEFAULT 'present',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(session_id, student_id)
);

CREATE TABLE public.attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  description TEXT,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE UNIQUE,
  type assessment_type NOT NULL,
  avg_score NUMERIC,
  completion_rate NUMERIC,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.subject_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  chapter_number TEXT NOT NULL,
  topic_title TEXT NOT NULL,
  notes TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS with permissive public policies (single-teacher MVP, PIN-gated on frontend)
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weeks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subject_templates ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY['students','subjects','weeks','sessions','topics','attendance','attachments','assessments','subject_templates'])
  LOOP
    EXECUTE format('CREATE POLICY "public_all_%I" ON public.%I FOR ALL USING (true) WITH CHECK (true)', t, t);
  END LOOP;
END $$;

-- Storage bucket for attachments
INSERT INTO storage.buckets (id, name, public) VALUES ('attachments', 'attachments', true);

CREATE POLICY "public read attachments" ON storage.objects FOR SELECT USING (bucket_id = 'attachments');
CREATE POLICY "public insert attachments" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'attachments');
CREATE POLICY "public update attachments" ON storage.objects FOR UPDATE USING (bucket_id = 'attachments');
CREATE POLICY "public delete attachments" ON storage.objects FOR DELETE USING (bucket_id = 'attachments');

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER update_topics_updated_at BEFORE UPDATE ON public.topics
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================
-- SEED DATA
-- =====================

-- Subjects
INSERT INTO public.subjects (name, language_type) VALUES
  ('Internet Technology', NULL),
  ('Artificial Intelligence', NULL),
  ('Design and Analysis of Algorithm', NULL),
  ('Ethical Hacking', NULL),
  ('Probability and Statistics', NULL),
  ('Languages', 'Kannada');

-- 35 Students
INSERT INTO public.students (roll_number, full_name) VALUES
  ('BCA/001','Aarav Sharma'),('BCA/002','Vivaan Patel'),('BCA/003','Aditya Reddy'),
  ('BCA/004','Vihaan Iyer'),('BCA/005','Arjun Nair'),('BCA/006','Sai Kumar'),
  ('BCA/007','Reyansh Gupta'),('BCA/008','Krishna Rao'),('BCA/009','Ishaan Joshi'),
  ('BCA/010','Shaurya Mehta'),('BCA/011','Atharv Desai'),('BCA/012','Advik Pillai'),
  ('BCA/013','Pranav Menon'),('BCA/014','Dhruv Kapoor'),('BCA/015','Kabir Bhat'),
  ('BCA/016','Ananya Sharma'),('BCA/017','Diya Patel'),('BCA/018','Saanvi Reddy'),
  ('BCA/019','Aadhya Iyer'),('BCA/020','Aaradhya Nair'),('BCA/021','Anika Kumar'),
  ('BCA/022','Navya Gupta'),('BCA/023','Kiara Rao'),('BCA/024','Myra Joshi'),
  ('BCA/025','Sara Mehta'),('BCA/026','Pari Desai'),('BCA/027','Ira Pillai'),
  ('BCA/028','Riya Menon'),('BCA/029','Kavya Kapoor'),('BCA/030','Aisha Bhat'),
  ('BCA/031','Rohan Singh'),('BCA/032','Karthik Naidu'),('BCA/033','Meera Shetty'),
  ('BCA/034','Tanvi Hegde'),('BCA/035','Yash Kulkarni');

-- Demo week (Mon-Sat). Uses current week starting Monday.
DO $$
DECLARE
  v_week_id UUID;
  v_monday DATE;
  s_it UUID; s_ai UUID; s_da UUID; s_eh UUID; s_ps UUID; s_lg UUID;
  v_session UUID;
  v_topic UUID;
  v_student RECORD;
  v_idx INT;
BEGIN
  v_monday := date_trunc('week', CURRENT_DATE)::date;

  INSERT INTO public.weeks (start_date, end_date, label)
  VALUES (v_monday, v_monday + 5, 'Week of ' || to_char(v_monday, 'Mon DD, YYYY'))
  RETURNING id INTO v_week_id;

  SELECT id INTO s_it FROM public.subjects WHERE name='Internet Technology';
  SELECT id INTO s_ai FROM public.subjects WHERE name='Artificial Intelligence';
  SELECT id INTO s_da FROM public.subjects WHERE name='Design and Analysis of Algorithm';
  SELECT id INTO s_eh FROM public.subjects WHERE name='Ethical Hacking';
  SELECT id INTO s_ps FROM public.subjects WHERE name='Probability and Statistics';
  SELECT id INTO s_lg FROM public.subjects WHERE name='Languages';

  -- Helper inline: create session + topic + attendance
  -- MONDAY: IT, AI
  INSERT INTO public.sessions (week_id, subject_id, date, day_of_week, start_time, end_time)
  VALUES (v_week_id, s_it, v_monday, 'Monday', '09:00', '10:00') RETURNING id INTO v_session;
  INSERT INTO public.topics (session_id, chapter_number, title, status) VALUES (v_session, '1', 'Basics of Internet', 'completed');

  INSERT INTO public.sessions (week_id, subject_id, date, day_of_week, start_time, end_time)
  VALUES (v_week_id, s_ai, v_monday, 'Monday', '11:00', '12:00') RETURNING id INTO v_session;
  INSERT INTO public.topics (session_id, chapter_number, title, status) VALUES (v_session, '1', 'AI Overview', 'completed');
  INSERT INTO public.assessments (session_id, type, avg_score, completion_rate, notes)
  VALUES (v_session, 'Quiz', 78, 92, 'Intro AI quiz');

  INSERT INTO public.sessions (week_id, subject_id, date, day_of_week, start_time, end_time)
  VALUES (v_week_id, s_da, v_monday, 'Monday', '14:00', '15:00') RETURNING id INTO v_session;
  INSERT INTO public.topics (session_id, chapter_number, title, status) VALUES (v_session, '1', 'Introduction to Algorithms', 'in_progress');

  -- TUESDAY
  INSERT INTO public.sessions (week_id, subject_id, date, day_of_week, start_time, end_time)
  VALUES (v_week_id, s_it, v_monday + 1, 'Tuesday', '09:00', '10:00') RETURNING id INTO v_session;
  INSERT INTO public.topics (session_id, chapter_number, part_number, title, status) VALUES (v_session, '2', 1, 'TCP/IP Layered Architecture', 'in_progress');

  INSERT INTO public.sessions (week_id, subject_id, date, day_of_week, start_time, end_time)
  VALUES (v_week_id, s_eh, v_monday + 1, 'Tuesday', '11:00', '12:00') RETURNING id INTO v_session;
  INSERT INTO public.topics (session_id, chapter_number, title, status) VALUES (v_session, '1', 'Fundamentals of Ethical Hacking', 'completed');

  INSERT INTO public.sessions (week_id, subject_id, date, day_of_week, start_time, end_time)
  VALUES (v_week_id, s_ps, v_monday + 1, 'Tuesday', '14:00', '15:00') RETURNING id INTO v_session;
  INSERT INTO public.topics (session_id, chapter_number, title, status) VALUES (v_session, '1', 'Probability Basics', 'not_started');

  -- WEDNESDAY
  INSERT INTO public.sessions (week_id, subject_id, date, day_of_week, start_time, end_time)
  VALUES (v_week_id, s_ai, v_monday + 2, 'Wednesday', '09:00', '10:00') RETURNING id INTO v_session;
  INSERT INTO public.topics (session_id, chapter_number, part_number, title, status) VALUES (v_session, '2', 1, 'Search Algorithms', 'in_progress');

  INSERT INTO public.sessions (week_id, subject_id, date, day_of_week, start_time, end_time)
  VALUES (v_week_id, s_da, v_monday + 2, 'Wednesday', '11:00', '12:00') RETURNING id INTO v_session;
  INSERT INTO public.topics (session_id, chapter_number, part_number, title, status) VALUES (v_session, '2', 1, 'Sorting Algorithms', 'not_started');

  INSERT INTO public.sessions (week_id, subject_id, date, day_of_week, start_time, end_time)
  VALUES (v_week_id, s_lg, v_monday + 2, 'Wednesday', '14:00', '15:00') RETURNING id INTO v_session;
  INSERT INTO public.topics (session_id, chapter_number, title, notes, status) VALUES (v_session, '1', 'Grammar Basics (Kannada)', 'Kannada grammar fundamentals', 'completed');

  -- THURSDAY
  INSERT INTO public.sessions (week_id, subject_id, date, day_of_week, start_time, end_time)
  VALUES (v_week_id, s_it, v_monday + 3, 'Thursday', '09:00', '10:00') RETURNING id INTO v_session;
  INSERT INTO public.topics (session_id, chapter_number, part_number, title, status) VALUES (v_session, '2', 2, 'TCP/IP Protocols', 'not_started');

  INSERT INTO public.sessions (week_id, subject_id, date, day_of_week, start_time, end_time)
  VALUES (v_week_id, s_ai, v_monday + 3, 'Thursday', '11:00', '12:00') RETURNING id INTO v_session;
  INSERT INTO public.topics (session_id, chapter_number, part_number, title, status) VALUES (v_session, '2', 2, 'Heuristic Search', 'not_started');
  INSERT INTO public.assessments (session_id, type, avg_score, completion_rate, notes)
  VALUES (v_session, 'Assignment', 82, 88, 'Heuristic search assignment');

  INSERT INTO public.sessions (week_id, subject_id, date, day_of_week, start_time, end_time)
  VALUES (v_week_id, s_eh, v_monday + 3, 'Thursday', '14:00', '15:00') RETURNING id INTO v_session;
  INSERT INTO public.topics (session_id, chapter_number, part_number, title, status) VALUES (v_session, '2', 1, 'Network Scanning', 'not_started');

  -- FRIDAY
  INSERT INTO public.sessions (week_id, subject_id, date, day_of_week, start_time, end_time)
  VALUES (v_week_id, s_ps, v_monday + 4, 'Friday', '09:00', '10:00') RETURNING id INTO v_session;
  INSERT INTO public.topics (session_id, chapter_number, title, status) VALUES (v_session, '2', 'Descriptive Statistics', 'not_started');

  INSERT INTO public.sessions (week_id, subject_id, date, day_of_week, start_time, end_time)
  VALUES (v_week_id, s_lg, v_monday + 4, 'Friday', '11:00', '12:00') RETURNING id INTO v_session;
  INSERT INTO public.topics (session_id, chapter_number, title, status) VALUES (v_session, '2', 'Prose: Panchatantra', 'not_started');

  INSERT INTO public.sessions (week_id, subject_id, date, day_of_week, start_time, end_time)
  VALUES (v_week_id, s_da, v_monday + 4, 'Friday', '14:00', '15:00') RETURNING id INTO v_session;
  INSERT INTO public.topics (session_id, chapter_number, title, status) VALUES (v_session, '3', 'Greedy Algorithms', 'not_started');
  INSERT INTO public.assessments (session_id, type, avg_score, completion_rate, notes)
  VALUES (v_session, 'Test', 71, 95, 'Mid-week test');

  -- SATURDAY
  INSERT INTO public.sessions (week_id, subject_id, date, day_of_week, start_time, end_time)
  VALUES (v_week_id, s_it, v_monday + 5, 'Saturday', '09:00', '10:00') RETURNING id INTO v_session;
  INSERT INTO public.topics (session_id, chapter_number, title, status) VALUES (v_session, '3', 'HTTP & Web Protocols', 'not_started');

  INSERT INTO public.sessions (week_id, subject_id, date, day_of_week, start_time, end_time)
  VALUES (v_week_id, s_eh, v_monday + 5, 'Saturday', '11:00', '12:00') RETURNING id INTO v_session;
  INSERT INTO public.topics (session_id, chapter_number, part_number, title, status) VALUES (v_session, '2', 2, 'Vulnerability Assessment', 'not_started');

  -- Seed attendance ~85% present for every session
  FOR v_session IN SELECT id FROM public.sessions WHERE week_id = v_week_id
  LOOP
    v_idx := 0;
    FOR v_student IN SELECT id FROM public.students ORDER BY roll_number
    LOOP
      v_idx := v_idx + 1;
      INSERT INTO public.attendance (session_id, student_id, status)
      VALUES (
        v_session,
        v_student.id,
        CASE WHEN (v_idx * 7 + extract(epoch from now())::int) % 100 < 85 THEN 'present'::attendance_status ELSE 'absent'::attendance_status END
      );
    END LOOP;
  END LOOP;
END $$;

-- Subject templates
INSERT INTO public.subject_templates (subject_id, chapter_number, topic_title, sort_order)
SELECT s.id, t.chapter, t.title, t.ord FROM public.subjects s JOIN (VALUES
  ('Internet Technology','1','Basics of Internet',1),
  ('Internet Technology','2','TCP/IP Layered Architecture',2),
  ('Internet Technology','2','TCP/IP Protocols',3),
  ('Internet Technology','3','HTTP & Web Protocols',4),
  ('Internet Technology','4','DNS & Email',5),
  ('Artificial Intelligence','1','AI Overview',1),
  ('Artificial Intelligence','2','Search Algorithms',2),
  ('Artificial Intelligence','2','Heuristic Search',3),
  ('Artificial Intelligence','3','Knowledge Representation',4),
  ('Design and Analysis of Algorithm','1','Introduction to Algorithms',1),
  ('Design and Analysis of Algorithm','2','Sorting Algorithms',2),
  ('Design and Analysis of Algorithm','3','Greedy Algorithms',3),
  ('Design and Analysis of Algorithm','4','Dynamic Programming',4),
  ('Ethical Hacking','1','Fundamentals of Ethical Hacking',1),
  ('Ethical Hacking','2','Network Scanning',2),
  ('Ethical Hacking','2','Vulnerability Assessment',3),
  ('Ethical Hacking','3','Penetration Testing',4),
  ('Probability and Statistics','1','Probability Basics',1),
  ('Probability and Statistics','2','Descriptive Statistics',2),
  ('Probability and Statistics','3','Probability Distributions',3),
  ('Languages','1','Grammar Basics (Kannada)',1),
  ('Languages','2','Prose: Panchatantra',2),
  ('Languages','3','Poetry: Selected Works',3)
) AS t(subject_name, chapter, title, ord) ON s.name = t.subject_name;