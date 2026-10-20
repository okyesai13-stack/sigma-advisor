CREATE OR REPLACE FUNCTION public.redeem_coupon(p_code text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not_signed_in'; END IF;
  IF lower(regexp_replace(trim(coalesce(p_code,'')), '\s+', ' ', 'g')) <> 'planz vig' THEN
    RAISE EXCEPTION 'invalid_coupon';
  END IF;
  IF EXISTS (SELECT 1 FROM user_credits WHERE user_id = uid AND plan = 'pro') THEN
    RAISE EXCEPTION 'already_pro';
  END IF;
  UPDATE user_credits SET plan = 'pro', monthly_balance = 100,
    monthly_reset_at = now() + interval '1 month' WHERE user_id = uid;
  INSERT INTO credit_ledger (user_id, action, amount) VALUES (uid, 'coupon_pro', 100);
END $$;
REVOKE ALL ON FUNCTION public.redeem_coupon(text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.redeem_coupon(text) TO authenticated;