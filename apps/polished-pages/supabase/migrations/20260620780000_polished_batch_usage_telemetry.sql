-- Additive, inert telemetry for heavy batch operations (bulk translation,
-- multi-language editions, full-book runs). Records consumption only — it
-- enforces no limit and changes no billing. Lets us measure the real cost
-- driver before deciding how to meter it.
ALTER TABLE polished.usage_counters ADD COLUMN IF NOT EXISTS batch_units int NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION public.polished_record_batch_op(p_units int)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, polished
AS $$
DECLARE
  v_period text := to_char(now(), 'YYYY-MM');
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN RETURN; END IF;
  INSERT INTO polished.usage_counters(user_id, period) VALUES (v_uid, v_period)
    ON CONFLICT (user_id, period) DO NOTHING;
  UPDATE polished.usage_counters
    SET batch_units = batch_units + GREATEST(coalesce(p_units, 0), 0)
    WHERE user_id = v_uid AND period = v_period;
END;
$$;

GRANT EXECUTE ON FUNCTION public.polished_record_batch_op(int) TO authenticated;

CREATE OR REPLACE FUNCTION public.polished_batch_usage()
RETURNS int
LANGUAGE sql SECURITY DEFINER SET search_path = public, polished
AS $$
  SELECT coalesce((SELECT batch_units FROM polished.usage_counters
    WHERE user_id = auth.uid() AND period = to_char(now(), 'YYYY-MM')), 0);
$$;

GRANT EXECUTE ON FUNCTION public.polished_batch_usage() TO authenticated;
