-- Corridor-duty pilot rota generated from src/data/duties.ts.
-- Lesson duties end 5 minutes before the next lesson starts; the final duty ends at 14:15.
-- assigned_to is NULL until each student's Firebase UID is mapped. Keep display names in assigned_name.
-- Safe to rerun: matching active rota rows are skipped.

BEGIN;

WITH seed(day_of_week, start_time, end_time, duty_name, location, assigned_name) AS (
  VALUES
    (1, '07:40', '08:35', 'Girls corridor duty - Lesson 1', 'New Building Corridor', 'Eshaal'),
    (1, '08:40', '09:25', 'Girls corridor duty - Lesson 2', 'New Building Corridor', 'Mayan'),
    (1, '09:30', '10:35', 'Girls corridor duty - Lesson 3', 'New Building Corridor', 'Siri'),
    (1, '10:40', '11:20', 'Girls corridor duty - Lesson 4', 'New Building Corridor', 'Devanshi'),
    (1, '11:25', '12:35', 'Girls corridor duty - Lesson 5', 'New Building Corridor', 'Nourin'),
    (1, '12:40', '13:20', 'Girls corridor duty - Lesson 6', 'New Building Corridor', 'Zenia'),
    (1, '13:25', '14:15', 'Girls corridor duty - Lesson 7', 'New Building Corridor', 'Mariam Hamadeh'),
    (1, '07:40', '08:35', 'Girls corridor duty - Lesson 1', 'Old Building Corridor', 'Siri'),
    (1, '08:40', '09:25', 'Girls corridor duty - Lesson 2', 'Old Building Corridor', 'Fatma Abdullah'),
    (1, '09:30', '10:35', 'Girls corridor duty - Lesson 3', 'Old Building Corridor', 'Maryam Hassan'),
    (1, '10:40', '11:20', 'Girls corridor duty - Lesson 4', 'Old Building Corridor', 'Tiara'),
    (1, '11:25', '12:35', 'Girls corridor duty - Lesson 5', 'Old Building Corridor', 'Zimmal'),
    (1, '12:40', '13:20', 'Girls corridor duty - Lesson 6', 'Old Building Corridor', 'Ayesha'),
    (1, '13:25', '14:15', 'Girls corridor duty - Lesson 7', 'Old Building Corridor', 'Inaaya'),
    (1, '07:40', '08:35', 'Boys corridor duty - Lesson 1', 'New Building Corridor', 'wesley'),
    (1, '08:40', '09:25', 'Boys corridor duty - Lesson 2', 'New Building Corridor', 'Moaz'),
    (1, '09:30', '10:35', 'Boys corridor duty - Lesson 3', 'New Building Corridor', 'Shayan'),
    (1, '10:40', '11:20', 'Boys corridor duty - Lesson 4', 'New Building Corridor', 'Joel'),
    (1, '11:25', '12:35', 'Boys corridor duty - Lesson 5', 'New Building Corridor', 'Ibrahim'),
    (1, '12:40', '13:20', 'Boys corridor duty - Lesson 6', 'New Building Corridor', 'Adney'),
    (1, '13:25', '14:15', 'Boys corridor duty - Lesson 7', 'New Building Corridor', 'Ahmed'),
    (1, '07:40', '08:35', 'Boys corridor duty - Lesson 1', 'Old Building Corridor', 'hayk'),
    (1, '08:40', '09:25', 'Boys corridor duty - Lesson 2', 'Old Building Corridor', 'M.H'),
    (1, '09:30', '10:35', 'Boys corridor duty - Lesson 3', 'Old Building Corridor', 'Habibur'),
    (1, '10:40', '11:20', 'Boys corridor duty - Lesson 4', 'Old Building Corridor', 'Yusuf Hassan'),
    (1, '11:25', '12:35', 'Boys corridor duty - Lesson 5', 'Old Building Corridor', 'Sinan'),
    (1, '12:40', '13:20', 'Boys corridor duty - Lesson 6', 'Old Building Corridor', 'Karam (V)'),
    (1, '13:25', '14:15', 'Boys corridor duty - Lesson 7', 'Old Building Corridor', 'Sofyan'),
    (2, '07:40', '08:35', 'Girls corridor duty - Lesson 1', 'New Building Corridor', 'Devanshi'),
    (2, '08:40', '09:25', 'Girls corridor duty - Lesson 2', 'New Building Corridor', 'Eshaal'),
    (2, '09:30', '10:35', 'Girls corridor duty - Lesson 3', 'New Building Corridor', 'Mariam Hamadeh'),
    (2, '10:40', '11:20', 'Girls corridor duty - Lesson 4', 'New Building Corridor', 'Nourin'),
    (2, '11:25', '12:35', 'Girls corridor duty - Lesson 5', 'New Building Corridor', 'Sharlin'),
    (2, '12:40', '13:20', 'Girls corridor duty - Lesson 6', 'New Building Corridor', 'Sharlin'),
    (2, '13:25', '14:15', 'Girls corridor duty - Lesson 7', 'New Building Corridor', 'Inaaya'),
    (2, '07:40', '08:35', 'Girls corridor duty - Lesson 1', 'Old Building Corridor', 'Tiara'),
    (2, '08:40', '09:25', 'Girls corridor duty - Lesson 2', 'Old Building Corridor', 'Siri'),
    (2, '09:30', '10:35', 'Girls corridor duty - Lesson 3', 'Old Building Corridor', 'Sarah Qasem'),
    (2, '10:40', '11:20', 'Girls corridor duty - Lesson 4', 'Old Building Corridor', 'Khalisa'),
    (2, '11:25', '12:35', 'Girls corridor duty - Lesson 5', 'Old Building Corridor', 'Sara Abutalib'),
    (2, '12:40', '13:20', 'Girls corridor duty - Lesson 6', 'Old Building Corridor', 'Reema'),
    (2, '13:25', '14:15', 'Girls corridor duty - Lesson 7', 'Old Building Corridor', 'Zenia'),
    (2, '07:40', '08:35', 'Boys corridor duty - Lesson 1', 'New Building Corridor', 'hassan (V)'),
    (2, '08:40', '09:25', 'Boys corridor duty - Lesson 2', 'New Building Corridor', 'Hayk'),
    (2, '09:30', '10:35', 'Boys corridor duty - Lesson 3', 'New Building Corridor', 'Karam (V)'),
    (2, '10:40', '11:20', 'Boys corridor duty - Lesson 4', 'New Building Corridor', 'Moaz'),
    (2, '11:25', '12:35', 'Boys corridor duty - Lesson 5', 'New Building Corridor', 'Ibrahim'),
    (2, '12:40', '13:20', 'Boys corridor duty - Lesson 6', 'New Building Corridor', 'Ibrahim'),
    (2, '13:25', '14:15', 'Boys corridor duty - Lesson 7', 'New Building Corridor', 'Habibur'),
    (2, '07:40', '08:35', 'Boys corridor duty - Lesson 1', 'Old Building Corridor', 'yagiz (V)'),
    (2, '08:40', '09:25', 'Boys corridor duty - Lesson 2', 'Old Building Corridor', 'Wesley'),
    (2, '09:30', '10:35', 'Boys corridor duty - Lesson 3', 'Old Building Corridor', 'Saad (V)'),
    (2, '10:40', '11:20', 'Boys corridor duty - Lesson 4', 'Old Building Corridor', 'Omar'),
    (2, '11:25', '12:35', 'Boys corridor duty - Lesson 5', 'Old Building Corridor', 'Yusuf Hassan'),
    (2, '12:40', '13:20', 'Boys corridor duty - Lesson 6', 'Old Building Corridor', 'Joel'),
    (2, '13:25', '14:15', 'Boys corridor duty - Lesson 7', 'Old Building Corridor', 'Sinan'),
    (3, '07:40', '08:35', 'Girls corridor duty - Lesson 1', 'New Building Corridor', 'Elena'),
    (3, '08:40', '09:25', 'Girls corridor duty - Lesson 2', 'New Building Corridor', 'Safa'),
    (3, '09:30', '10:35', 'Girls corridor duty - Lesson 3', 'New Building Corridor', 'Renoaa'),
    (3, '10:40', '11:20', 'Girls corridor duty - Lesson 4', 'New Building Corridor', 'Maryam Hassan'),
    (3, '11:25', '12:35', 'Girls corridor duty - Lesson 5', 'New Building Corridor', 'Eshaal'),
    (3, '12:40', '13:20', 'Girls corridor duty - Lesson 6', 'New Building Corridor', 'Ayesha'),
    (3, '13:25', '14:15', 'Girls corridor duty - Lesson 7', 'New Building Corridor', 'Aaira'),
    (3, '07:40', '08:35', 'Girls corridor duty - Lesson 1', 'Old Building Corridor', 'Sarah Sen'),
    (3, '08:40', '09:25', 'Girls corridor duty - Lesson 2', 'Old Building Corridor', 'Khalisa'),
    (3, '09:30', '10:35', 'Girls corridor duty - Lesson 3', 'Old Building Corridor', 'Mayan'),
    (3, '10:40', '11:20', 'Girls corridor duty - Lesson 4', 'Old Building Corridor', 'Sarah Sen'),
    (3, '11:25', '12:35', 'Girls corridor duty - Lesson 5', 'Old Building Corridor', 'Zimmal'),
    (3, '12:40', '13:20', 'Girls corridor duty - Lesson 6', 'Old Building Corridor', 'Inaaya'),
    (3, '13:25', '14:15', 'Girls corridor duty - Lesson 7', 'Old Building Corridor', 'Sara Abutalib'),
    (3, '07:40', '08:35', 'Boys corridor duty - Lesson 1', 'New Building Corridor', 'wesley'),
    (3, '08:40', '09:25', 'Boys corridor duty - Lesson 2', 'New Building Corridor', 'Yusuf Hassan'),
    (3, '09:30', '10:35', 'Boys corridor duty - Lesson 3', 'New Building Corridor', 'Omar'),
    (3, '10:40', '11:20', 'Boys corridor duty - Lesson 4', 'New Building Corridor', 'Sanad'),
    (3, '11:25', '12:35', 'Boys corridor duty - Lesson 5', 'New Building Corridor', 'Hassan (V)'),
    (3, '12:40', '13:20', 'Boys corridor duty - Lesson 6', 'New Building Corridor', 'Habibur'),
    (3, '13:25', '14:15', 'Boys corridor duty - Lesson 7', 'New Building Corridor', 'Moaz'),
    (3, '07:40', '08:35', 'Boys corridor duty - Lesson 1', 'Old Building Corridor', 'Muhammad H'),
    (3, '08:40', '09:25', 'Boys corridor duty - Lesson 2', 'Old Building Corridor', 'Karam (V)'),
    (3, '09:30', '10:35', 'Boys corridor duty - Lesson 3', 'Old Building Corridor', 'Hayk'),
    (3, '10:40', '11:20', 'Boys corridor duty - Lesson 4', 'Old Building Corridor', 'Sinan'),
    (3, '11:25', '12:35', 'Boys corridor duty - Lesson 5', 'Old Building Corridor', 'Yagiz  (V)'),
    (3, '12:40', '13:20', 'Boys corridor duty - Lesson 6', 'Old Building Corridor', 'Shayan'),
    (3, '13:25', '14:15', 'Boys corridor duty - Lesson 7', 'Old Building Corridor', 'Saad (V)'),
    (4, '07:40', '08:35', 'Girls corridor duty - Lesson 1', 'New Building Corridor', 'Eshaal'),
    (4, '08:40', '09:25', 'Girls corridor duty - Lesson 2', 'New Building Corridor', 'Devanshi'),
    (4, '09:30', '10:35', 'Girls corridor duty - Lesson 3', 'New Building Corridor', 'Eshaal'),
    (4, '10:40', '11:20', 'Girls corridor duty - Lesson 4', 'New Building Corridor', 'Mayan'),
    (4, '11:25', '12:35', 'Girls corridor duty - Lesson 5', 'New Building Corridor', 'Renoaa'),
    (4, '12:40', '13:20', 'Girls corridor duty - Lesson 6', 'New Building Corridor', 'Reema'),
    (4, '13:25', '14:15', 'Girls corridor duty - Lesson 7', 'New Building Corridor', 'Sharlin'),
    (4, '07:40', '08:35', 'Girls corridor duty - Lesson 1', 'Old Building Corridor', 'Elena'),
    (4, '08:40', '09:25', 'Girls corridor duty - Lesson 2', 'Old Building Corridor', 'Sarah Sen'),
    (4, '09:30', '10:35', 'Girls corridor duty - Lesson 3', 'Old Building Corridor', 'Maryam Hassan'),
    (4, '10:40', '11:20', 'Girls corridor duty - Lesson 4', 'Old Building Corridor', 'Nourin'),
    (4, '11:25', '12:35', 'Girls corridor duty - Lesson 5', 'Old Building Corridor', 'Khalisa'),
    (4, '12:40', '13:20', 'Girls corridor duty - Lesson 6', 'Old Building Corridor', 'Aaira'),
    (4, '13:25', '14:15', 'Girls corridor duty - Lesson 7', 'Old Building Corridor', 'Mariam Hamadeh'),
    (4, '07:40', '08:35', 'Boys corridor duty - Lesson 1', 'New Building Corridor', 'hassan (V)'),
    (4, '08:40', '09:25', 'Boys corridor duty - Lesson 2', 'New Building Corridor', 'Wesley'),
    (4, '09:30', '10:35', 'Boys corridor duty - Lesson 3', 'New Building Corridor', 'Yusuf Hassan'),
    (4, '10:40', '11:20', 'Boys corridor duty - Lesson 4', 'New Building Corridor', 'Saad (V)'),
    (4, '11:25', '12:35', 'Boys corridor duty - Lesson 5', 'New Building Corridor', 'Habibur'),
    (4, '12:40', '13:20', 'Boys corridor duty - Lesson 6', 'New Building Corridor', 'Omar'),
    (4, '13:25', '14:15', 'Boys corridor duty - Lesson 7', 'New Building Corridor', 'Moaz'),
    (4, '07:40', '08:35', 'Boys corridor duty - Lesson 1', 'Old Building Corridor', 'Joel'),
    (4, '08:40', '09:25', 'Boys corridor duty - Lesson 2', 'Old Building Corridor', 'Shayan'),
    (4, '09:30', '10:35', 'Boys corridor duty - Lesson 3', 'Old Building Corridor', 'Muhammad H'),
    (4, '10:40', '11:20', 'Boys corridor duty - Lesson 4', 'Old Building Corridor', 'Hayk'),
    (4, '11:25', '12:35', 'Boys corridor duty - Lesson 5', 'Old Building Corridor', 'Sanad'),
    (4, '12:40', '13:20', 'Boys corridor duty - Lesson 6', 'Old Building Corridor', 'Yagiz'),
    (4, '13:25', '14:15', 'Boys corridor duty - Lesson 7', 'Old Building Corridor', 'Hamzah (V)'),
    (5, '07:40', '08:35', 'Girls corridor duty - Lesson 1', 'New Building Corridor', 'Eshaal'),
    (5, '08:40', '09:25', 'Girls corridor duty - Lesson 2', 'New Building Corridor', 'Sara Abutalib'),
    (5, '09:30', '10:35', 'Girls corridor duty - Lesson 3', 'New Building Corridor', 'Siri'),
    (5, '10:40', '14:15', 'Girls corridor duty - Lesson 4', 'New Building Corridor', 'Eshaal'),
    (5, '07:40', '08:35', 'Girls corridor duty - Lesson 1', 'Old Building Corridor', 'Sarah'),
    (5, '08:40', '09:25', 'Girls corridor duty - Lesson 2', 'Old Building Corridor', 'Safa'),
    (5, '09:30', '10:35', 'Girls corridor duty - Lesson 3', 'Old Building Corridor', 'Fatma Abdullah'),
    (5, '10:40', '14:15', 'Girls corridor duty - Lesson 4', 'Old Building Corridor', 'Elena'),
    (5, '07:40', '08:35', 'Boys corridor duty - Lesson 1', 'New Building Corridor', 'wesley'),
    (5, '08:40', '09:25', 'Boys corridor duty - Lesson 2', 'New Building Corridor', 'Saad (V)'),
    (5, '09:30', '10:35', 'Boys corridor duty - Lesson 3', 'New Building Corridor', 'Moaz'),
    (5, '10:40', '14:15', 'Boys corridor duty - Lesson 4', 'New Building Corridor', 'Yusuf Hassan'),
    (5, '07:40', '08:35', 'Boys corridor duty - Lesson 1', 'Old Building Corridor', 'Muhammad H'),
    (5, '08:40', '09:25', 'Boys corridor duty - Lesson 2', 'Old Building Corridor', 'Hayk'),
    (5, '09:30', '10:35', 'Boys corridor duty - Lesson 3', 'Old Building Corridor', 'Joel'),
    (5, '10:40', '14:15', 'Boys corridor duty - Lesson 4', 'Old Building Corridor', 'Shayan')
), inserted AS (
  INSERT INTO public.duty_rotas (
    id, day_of_week, start_time, end_time, duty_name, location,
    assigned_to, assigned_name, active, created_at, updated_at
  )
  SELECT
    gen_random_uuid(), seed.day_of_week,
    seed.start_time::time, seed.end_time::time,
    seed.duty_name, seed.location,
    NULL::text, seed.assigned_name, true, now(), now()
  FROM seed
  WHERE NOT EXISTS (
    SELECT 1
    FROM public.duty_rotas AS existing
    WHERE existing.day_of_week = seed.day_of_week
      AND existing.start_time = seed.start_time::time
      AND existing.end_time = seed.end_time::time
      AND existing.duty_name = seed.duty_name
      AND existing.location = seed.location
      AND existing.assigned_name IS NOT DISTINCT FROM seed.assigned_name
      AND existing.active = true
  )
  RETURNING id
)
SELECT count(*) AS inserted_rota_rows FROM inserted;

COMMIT;
