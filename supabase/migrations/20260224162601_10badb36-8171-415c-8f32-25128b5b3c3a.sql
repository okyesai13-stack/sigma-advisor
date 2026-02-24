-- Add DELETE policies for tables that need idempotency
CREATE POLICY "Anyone can delete learning plan" ON public.learning_plan_result FOR DELETE USING (true);
CREATE POLICY "Anyone can delete project ideas" ON public.project_ideas_result FOR DELETE USING (true);
CREATE POLICY "Anyone can delete job matching" ON public.job_matching_result FOR DELETE USING (true);
CREATE POLICY "Anyone can delete career goal score" ON public.career_goal_score_result FOR DELETE USING (true);