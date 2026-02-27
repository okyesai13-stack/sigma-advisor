
CREATE POLICY "Anyone can delete career analysis"
  ON public.career_analysis_result FOR DELETE USING (true);

CREATE POLICY "Anyone can delete skill validation"
  ON public.skill_validation_result FOR DELETE USING (true);

CREATE POLICY "Anyone can delete ai_role_analysis"
  ON public.ai_role_analysis_result FOR DELETE USING (true);
