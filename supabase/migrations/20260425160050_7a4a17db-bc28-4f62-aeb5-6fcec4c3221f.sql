-- Add total_marks to assessments
ALTER TABLE public.assessments
ADD COLUMN IF NOT EXISTS total_marks numeric;

-- Per-student scores for an assessment
CREATE TABLE IF NOT EXISTS public.assessment_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id uuid NOT NULL,
  student_id uuid NOT NULL,
  score numeric,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (assessment_id, student_id)
);

ALTER TABLE public.assessment_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_all_assessment_scores"
ON public.assessment_scores
FOR ALL
USING (true)
WITH CHECK (true);

CREATE TRIGGER update_assessment_scores_updated_at
BEFORE UPDATE ON public.assessment_scores
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_assessment_scores_assessment ON public.assessment_scores(assessment_id);
CREATE INDEX IF NOT EXISTS idx_assessment_scores_student ON public.assessment_scores(student_id);