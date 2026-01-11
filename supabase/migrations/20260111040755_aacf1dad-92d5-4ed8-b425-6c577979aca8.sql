-- Fix the handle_new_user trigger to use sigma_journey_state instead of deleted user_journey_state
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.users_profile (id) VALUES (NEW.id);
  INSERT INTO public.sigma_journey_state (user_id) VALUES (NEW.id);
  RETURN NEW;
END;
$function$;