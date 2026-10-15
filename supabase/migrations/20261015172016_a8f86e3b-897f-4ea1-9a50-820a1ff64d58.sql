CREATE TABLE public.user_credits (
  user_id uuid PRIMARY KEY,
  plan text NOT NULL DEFAULT 'free',
  daily_balance integer NOT NULL DEFAULT 5,
  daily_reset_at timestamptz NOT NULL DEFAULT (date_trunc('day', now() AT TIME ZONE 'utc') AT TIME ZONE 'utc') + interval '1 day',
  monthly_balance integer NOT NULL DEFAULT 0,
  monthly_reset_at timestamptz NOT NULL DEFAULT now() + interval '1 month',
  topup_balance integer NOT NULL DEFAULT 0,
  upgrade_requested_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.user_credits TO authenticated;
GRANT ALL ON public.user_credits TO service_role;
ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "uc own read" ON public.user_credits FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE TABLE public.credit_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  action text NOT NULL,
  amount integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.credit_ledger TO authenticated;
GRANT ALL ON public.credit_ledger TO service_role;
ALTER TABLE public.credit_ledger ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cl own read" ON public.credit_ledger FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE INDEX credit_ledger_user_idx ON public.credit_ledger(user_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.credit_cost(p_action text) RETURNS integer LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT CASE p_action
    WHEN 'convene' THEN 10 WHEN 'agent_rerun' THEN 2 WHEN 'stress_test' THEN 5
    WHEN 'canvas_ai' THEN 1 WHEN 'advisor_chat' THEN 1 ELSE NULL END
$$;

CREATE OR REPLACE FUNCTION public.refresh_credits(p_user uuid) RETURNS public.user_credits
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r public.user_credits;
BEGIN
  INSERT INTO public.user_credits(user_id) VALUES (p_user) ON CONFLICT DO NOTHING;
  SELECT * INTO r FROM public.user_credits WHERE user_id = p_user FOR UPDATE;
  IF now() >= r.daily_reset_at THEN
    r.daily_balance := 5;
    r.daily_reset_at := (date_trunc('day', now() AT TIME ZONE 'utc') AT TIME ZONE 'utc') + interval '1 day';
  END IF;
  IF now() >= r.monthly_reset_at THEN
    r.monthly_balance := CASE WHEN r.plan = 'pro' THEN 100 ELSE 0 END;
    WHILE r.monthly_reset_at <= now() LOOP r.monthly_reset_at := r.monthly_reset_at + interval '1 month'; END LOOP;
  END IF;
  UPDATE public.user_credits SET daily_balance = r.daily_balance, daily_reset_at = r.daily_reset_at,
    monthly_balance = r.monthly_balance, monthly_reset_at = r.monthly_reset_at, updated_at = now()
  WHERE user_id = p_user RETURNING * INTO r;
  RETURN r;
END $$;

CREATE OR REPLACE FUNCTION public.get_my_credits() RETURNS public.user_credits
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  RETURN public.refresh_credits(auth.uid());
END $$;

CREATE OR REPLACE FUNCTION public.spend_credits(p_action text) RETURNS public.user_credits
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r public.user_credits; cost integer; take integer; left_ integer;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  cost := public.credit_cost(p_action);
  IF cost IS NULL THEN RAISE EXCEPTION 'unknown_action'; END IF;
  r := public.refresh_credits(auth.uid());
  IF r.daily_balance + r.monthly_balance + r.topup_balance < cost THEN RAISE EXCEPTION 'insufficient_credits'; END IF;
  left_ := cost;
  take := least(left_, r.daily_balance); r.daily_balance := r.daily_balance - take; left_ := left_ - take;
  take := least(left_, r.monthly_balance); r.monthly_balance := r.monthly_balance - take; left_ := left_ - take;
  r.topup_balance := r.topup_balance - left_;
  UPDATE public.user_credits SET daily_balance = r.daily_balance, monthly_balance = r.monthly_balance,
    topup_balance = r.topup_balance, updated_at = now() WHERE user_id = auth.uid() RETURNING * INTO r;
  INSERT INTO public.credit_ledger(user_id, action, amount) VALUES (auth.uid(), p_action, -cost);
  RETURN r;
END $$;

CREATE OR REPLACE FUNCTION public.request_upgrade() RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  PERFORM public.refresh_credits(auth.uid());
  UPDATE public.user_credits SET upgrade_requested_at = now() WHERE user_id = auth.uid();
END $$;

REVOKE EXECUTE ON FUNCTION public.refresh_credits(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_my_credits() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.spend_credits(text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.request_upgrade() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_credits() TO authenticated;
GRANT EXECUTE ON FUNCTION public.spend_credits(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.request_upgrade() TO authenticated;

INSERT INTO public.user_credits(user_id) SELECT id FROM auth.users ON CONFLICT DO NOTHING;

CREATE OR REPLACE FUNCTION public.handle_new_user_credits() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN INSERT INTO public.user_credits(user_id) VALUES (NEW.id) ON CONFLICT DO NOTHING; RETURN NEW; END $$;
REVOKE EXECUTE ON FUNCTION public.handle_new_user_credits() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER on_auth_user_created_credits AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_credits();