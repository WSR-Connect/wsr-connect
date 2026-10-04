BEGIN;

ALTER TABLE public.duty_rotas
  ADD COLUMN IF NOT EXISTS assigned_name text;

ALTER TABLE public.daily_duties
  ADD COLUMN IF NOT EXISTS assigned_name text;

ALTER TABLE public.duty_rotas
  ALTER COLUMN assigned_to DROP NOT NULL;

ALTER TABLE public.daily_duties
  ALTER COLUMN assigned_to DROP NOT NULL;

CREATE OR REPLACE FUNCTION public.clear_duty_cover(
  p_daily_duty_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_status text;
BEGIN
  SELECT status
  INTO current_status
  FROM public.daily_duties
  WHERE id = p_daily_duty_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Daily duty not found.';
  END IF;

  IF current_status <> 'covered' THEN
    RAISE EXCEPTION 'This duty does not have an active cover to remove.';
  END IF;

  DELETE FROM public.duty_covers
  WHERE daily_duty_id = p_daily_duty_id;

  UPDATE public.daily_duties
  SET
    status = 'pending',
    completed_at = NULL,
    updated_at = now()
  WHERE id = p_daily_duty_id;
END;
$$;

REVOKE ALL ON FUNCTION public.clear_duty_cover(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.clear_duty_cover(uuid) TO service_role;

COMMIT;
