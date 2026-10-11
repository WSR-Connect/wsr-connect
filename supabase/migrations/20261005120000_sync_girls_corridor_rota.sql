CREATE OR REPLACE FUNCTION public.sync_girls_corridor_rota(
  p_assignments jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_item jsonb;
  v_day integer;
  v_lesson integer;
  v_lesson_text text;
  v_start text;
  v_end text;
  v_expected_start text;
  v_expected_end text;
  v_duty_name text;
  v_location text;
  v_assigned_name text;
  v_existing_id uuid;
  v_expected_count integer;
  v_actual_count integer;
  v_row_count integer;
  v_matched integer := 0;
  v_inserted integer := 0;
  v_paused integer := 0;
  v_refreshed integer := 0;
  v_now timestamptz := now();
BEGIN
  IF jsonb_typeof(p_assignments) IS DISTINCT FROM 'array' THEN
    RAISE EXCEPTION 'The rota payload must be an array.';
  END IF;

  IF jsonb_array_length(p_assignments) <> 64 THEN
    RAISE EXCEPTION 'The rota payload must contain all 64 weekday assignments.';
  END IF;

  FOR v_item IN
    SELECT value FROM jsonb_array_elements(p_assignments)
  LOOP
    IF jsonb_typeof(v_item->'day_of_week') IS DISTINCT FROM 'number'
       OR jsonb_typeof(v_item->'start_time') IS DISTINCT FROM 'string'
       OR jsonb_typeof(v_item->'end_time') IS DISTINCT FROM 'string'
       OR jsonb_typeof(v_item->'duty_name') IS DISTINCT FROM 'string'
       OR jsonb_typeof(v_item->'location') IS DISTINCT FROM 'string'
       OR jsonb_typeof(v_item->'assigned_name') IS DISTINCT FROM 'string' THEN
      RAISE EXCEPTION 'Every rota assignment must include the expected typed fields.';
    END IF;

    IF (v_item->>'day_of_week') !~ '^[1-5]$' THEN
      RAISE EXCEPTION 'Rota assignments must be for Monday through Friday.';
    END IF;

    v_day := (v_item->>'day_of_week')::integer;
    v_start := v_item->>'start_time';
    v_end := v_item->>'end_time';
    v_duty_name := v_item->>'duty_name';
    v_location := v_item->>'location';
    v_assigned_name := btrim(v_item->>'assigned_name');
    v_lesson_text := substring(v_duty_name FROM '^Girls corridor duty - Lesson ([1-7])$');

    IF v_lesson_text IS NULL
       OR v_location NOT IN ('New Building Corridor', 'Old Building Corridor')
       OR length(v_assigned_name) NOT BETWEEN 1 AND 100
       OR v_start !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
       OR v_end !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' THEN
      RAISE EXCEPTION 'A rota assignment contains an invalid lesson, corridor, student name, or time.';
    END IF;

    v_lesson := v_lesson_text::integer;
    IF v_day = 5 AND v_lesson > 4 THEN
      RAISE EXCEPTION 'Friday supports four lessons in the current school rota.';
    END IF;

    v_expected_start := CASE v_lesson
      WHEN 1 THEN '07:40'
      WHEN 2 THEN '08:40'
      WHEN 3 THEN '09:30'
      WHEN 4 THEN '10:40'
      WHEN 5 THEN '11:25'
      WHEN 6 THEN '12:40'
      ELSE '13:25'
    END;
    v_expected_end := CASE
      WHEN v_day = 5 AND v_lesson = 4 THEN '14:15'
      WHEN v_lesson = 1 THEN '08:35'
      WHEN v_lesson = 2 THEN '09:25'
      WHEN v_lesson = 3 THEN '10:35'
      WHEN v_lesson = 4 THEN '11:20'
      WHEN v_lesson = 5 THEN '12:35'
      WHEN v_lesson = 6 THEN '13:20'
      ELSE '14:15'
    END;

    IF v_start <> v_expected_start OR v_end <> v_expected_end THEN
      RAISE EXCEPTION 'A rota assignment has lesson times that do not match the approved timetable.';
    END IF;
  END LOOP;

  SELECT count(*)
  INTO v_actual_count
  FROM (
    SELECT day_of_week, duty_name, location
    FROM jsonb_to_recordset(p_assignments) AS assignment(
      day_of_week integer,
      start_time text,
      end_time text,
      duty_name text,
      location text,
      assigned_name text
    )
    GROUP BY day_of_week, duty_name, location
  ) AS unique_assignments;

  IF v_actual_count <> 64 THEN
    RAISE EXCEPTION 'The rota contains a duplicate or missing day, lesson, and corridor slot.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM jsonb_to_recordset(p_assignments) AS assignment(
      day_of_week integer,
      start_time text,
      end_time text,
      duty_name text,
      location text,
      assigned_name text
    )
    GROUP BY
      assignment.day_of_week,
      assignment.duty_name,
      lower(btrim(assignment.assigned_name))
    HAVING count(DISTINCT assignment.location) > 1
  ) THEN
    RAISE EXCEPTION 'A student cannot be assigned to both corridors during the same lesson.';
  END IF;

  FOR v_day IN 1..5 LOOP
    v_expected_count := CASE WHEN v_day = 5 THEN 8 ELSE 14 END;
    SELECT count(*)
    INTO v_actual_count
    FROM jsonb_to_recordset(p_assignments) AS assignment(day_of_week integer)
    WHERE assignment.day_of_week = v_day;

    IF v_actual_count <> v_expected_count THEN
      RAISE EXCEPTION 'The rota is incomplete for weekday %.', v_day;
    END IF;
  END LOOP;

  -- Serialize writes from overlapping edit-trigger executions.
  PERFORM pg_advisory_xact_lock(hashtextextended('girls-corridor-rota-sync', 0));

  FOR v_item IN
    SELECT value FROM jsonb_array_elements(p_assignments)
  LOOP
    v_day := (v_item->>'day_of_week')::integer;
    v_start := v_item->>'start_time';
    v_end := v_item->>'end_time';
    v_duty_name := v_item->>'duty_name';
    v_location := v_item->>'location';
    v_assigned_name := btrim(v_item->>'assigned_name');
    v_existing_id := NULL;

    SELECT id
    INTO v_existing_id
    FROM public.duty_rotas
    WHERE day_of_week = v_day
      AND start_time = v_start::time
      AND end_time = v_end::time
      AND duty_name = v_duty_name
      AND location = v_location
    ORDER BY active DESC, updated_at DESC, created_at ASC, id ASC
    LIMIT 1
    FOR UPDATE;

    IF v_existing_id IS NULL THEN
      INSERT INTO public.duty_rotas (
        id, day_of_week, start_time, end_time, duty_name, location,
        assigned_to, assigned_name, active, created_at, updated_at
      ) VALUES (
        gen_random_uuid(), v_day, v_start::time, v_end::time, v_duty_name,
        v_location, NULL, v_assigned_name, true, v_now, v_now
      );
      v_inserted := v_inserted + 1;
    ELSE
      UPDATE public.duty_rotas
      SET
        assigned_to = CASE
          WHEN assigned_name IS DISTINCT FROM v_assigned_name THEN NULL
          ELSE assigned_to
        END,
        assigned_name = v_assigned_name,
        active = true,
        updated_at = v_now
      WHERE id = v_existing_id;
      v_matched := v_matched + 1;

      UPDATE public.duty_rotas
      SET active = false, updated_at = v_now
      WHERE id <> v_existing_id
        AND active = true
        AND day_of_week = v_day
        AND start_time = v_start::time
        AND end_time = v_end::time
        AND duty_name = v_duty_name
        AND location = v_location;
      GET DIAGNOSTICS v_row_count = ROW_COUNT;
      v_paused := v_paused + v_row_count;
    END IF;
  END LOOP;

  UPDATE public.duty_rotas AS rota
  SET active = false, updated_at = v_now
  WHERE rota.active = true
    AND rota.duty_name ~ '^Girls corridor duty - Lesson [1-7]$'
    AND rota.location IN ('New Building Corridor', 'Old Building Corridor')
    AND NOT EXISTS (
      SELECT 1
      FROM jsonb_to_recordset(p_assignments) AS assignment(
        day_of_week integer,
        start_time text,
        end_time text,
        duty_name text,
        location text,
        assigned_name text
      )
      WHERE assignment.day_of_week = rota.day_of_week
        AND assignment.start_time::time = rota.start_time
        AND assignment.end_time::time = rota.end_time
        AND assignment.duty_name = rota.duty_name
        AND assignment.location = rota.location
    );
  GET DIAGNOSTICS v_row_count = ROW_COUNT;
  v_paused := v_paused + v_row_count;

  UPDATE public.daily_duties AS duty
  SET
    start_time = rota.start_time,
    end_time = rota.end_time,
    duty_name = rota.duty_name,
    location = rota.location,
    assigned_to = rota.assigned_to,
    assigned_name = rota.assigned_name,
    updated_at = v_now
  FROM public.duty_rotas AS rota
  WHERE duty.rota_id = rota.id
    AND duty.status = 'pending'
    AND duty.duty_date >= (now() AT TIME ZONE 'Asia/Dubai')::date
    AND rota.active = true
    AND rota.duty_name ~ '^Girls corridor duty - Lesson [1-7]$'
    AND rota.location IN ('New Building Corridor', 'Old Building Corridor');
  GET DIAGNOSTICS v_refreshed = ROW_COUNT;

  RETURN jsonb_build_object(
    'ok', true,
    'source_rows', 64,
    'matched', v_matched,
    'inserted', v_inserted,
    'paused', v_paused,
    'pending_duties_refreshed', v_refreshed
  );
END;
$$;

REVOKE ALL ON FUNCTION public.sync_girls_corridor_rota(jsonb)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.sync_girls_corridor_rota(jsonb)
  TO service_role;
