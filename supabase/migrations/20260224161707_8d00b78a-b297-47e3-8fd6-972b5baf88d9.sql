CREATE OR REPLACE FUNCTION public.get_journey_state(p_resume_id text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'career_analysis_completed', COALESCE(career_analysis_completed, false),
    'goal_score_completed', COALESCE(goal_score_completed, false),
    'skill_validation_completed', COALESCE(skill_validation_completed, false),
    'learning_plan_completed', COALESCE(learning_plan_completed, false),
    'project_ideas_completed', COALESCE(project_ideas_completed, false),
    'job_matching_completed', COALESCE(job_matching_completed, false)
  ) INTO result
  FROM public.journey_state
  WHERE resume_id = p_resume_id;

  IF result IS NULL THEN
    INSERT INTO public.journey_state (resume_id)
    VALUES (p_resume_id)
    ON CONFLICT (resume_id) DO NOTHING;

    result := jsonb_build_object(
      'career_analysis_completed', false,
      'goal_score_completed', false,
      'skill_validation_completed', false,
      'learning_plan_completed', false,
      'project_ideas_completed', false,
      'job_matching_completed', false
    );
  END IF;

  RETURN result;
END;
$function$;