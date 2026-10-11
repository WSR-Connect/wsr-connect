-- One-time refresh of the three changed assignments in the current
-- CORRIDOR DUTY (GIRLS) sheet. Safe to run more than once.
BEGIN;

DO $$
DECLARE
  v_now timestamptz := now();
  v_updated integer;
BEGIN
  IF EXISTS (
    SELECT 1
    FROM (VALUES
      (1, '12:40'::time, '13:20'::time, 'Girls corridor duty - Lesson 6', 'New Building Corridor'),
      (1, '13:25'::time, '14:15'::time, 'Girls corridor duty - Lesson 7', 'New Building Corridor'),
      (2, '07:40'::time, '08:35'::time, 'Girls corridor duty - Lesson 1', 'New Building Corridor')
    ) AS expected(day_of_week, start_time, end_time, duty_name, location)
    WHERE NOT EXISTS (
      SELECT 1
      FROM public.duty_rotas AS rota
      WHERE rota.active = true
        AND rota.day_of_week = expected.day_of_week
        AND rota.start_time = expected.start_time
        AND rota.end_time = expected.end_time
        AND rota.duty_name = expected.duty_name
        AND rota.location = expected.location
    )
  ) THEN
    RAISE EXCEPTION 'Could not find all three active rota slots; no changes were applied.';
  END IF;

  UPDATE public.duty_rotas AS rota
  SET
    assigned_to = CASE
      WHEN rota.assigned_name IS DISTINCT FROM changes.assigned_name THEN NULL
      ELSE rota.assigned_to
    END,
    assigned_name = changes.assigned_name,
    updated_at = v_now
  FROM (VALUES
    (1, '12:40'::time, '13:20'::time, 'Girls corridor duty - Lesson 6', 'New Building Corridor', 'Siri'),
    (1, '13:25'::time, '14:15'::time, 'Girls corridor duty - Lesson 7', 'New Building Corridor', 'Zenia'),
    (2, '07:40'::time, '08:35'::time, 'Girls corridor duty - Lesson 1', 'New Building Corridor', 'Sarah Sen')
  ) AS changes(day_of_week, start_time, end_time, duty_name, location, assigned_name)
  WHERE rota.active = true
    AND rota.day_of_week = changes.day_of_week
    AND rota.start_time = changes.start_time
    AND rota.end_time = changes.end_time
    AND rota.duty_name = changes.duty_name
    AND rota.location = changes.location;

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  IF v_updated < 3 THEN
    RAISE EXCEPTION 'Expected at least three rota rows, updated %; no changes were applied.', v_updated;
  END IF;

  UPDATE public.daily_duties AS duty
  SET
    assigned_to = rota.assigned_to,
    assigned_name = rota.assigned_name,
    updated_at = v_now
  FROM public.duty_rotas AS rota
  WHERE duty.rota_id = rota.id
    AND duty.status = 'pending'
    AND duty.duty_date >= (now() AT TIME ZONE 'Asia/Dubai')::date
    AND rota.active = true
    AND rota.day_of_week IN (1, 2)
    AND rota.duty_name IN (
      'Girls corridor duty - Lesson 1',
      'Girls corridor duty - Lesson 6',
      'Girls corridor duty - Lesson 7'
    )
    AND rota.location = 'New Building Corridor';
END $$;

COMMIT;
