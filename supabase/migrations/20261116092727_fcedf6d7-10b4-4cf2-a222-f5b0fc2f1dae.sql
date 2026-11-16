CREATE EXTENSION IF NOT EXISTS pg_cron;
SELECT cron.schedule('planz-deadline-reminders','0 * * * *','SELECT public.process_deadline_reminders();');