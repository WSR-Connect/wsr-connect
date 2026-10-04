# Duty tracker setup

The project uses Firebase Authentication and Firestore profiles, with Supabase
for rota and daily-duty records. Apply the files in this order:

1. Run `migrations/20261004120000_duty_assignments_and_cover.sql` in the
   Supabase SQL Editor. It adds the display-name fields and the transactional
   cover-removal function. The column changes are safe to rerun.
2. Deploy `functions/runtime-test/index.ts` as the existing `runtime-test`
   Edge Function. The project config keeps Supabase gateway JWT verification
   disabled because this function validates Firebase ID tokens itself.
3. Run `seed_corridor_duty_rotas.sql` in the SQL Editor. It inserts the
   weekday corridor pilot assignments and skips matching active rows if rerun.
4. Open the Duty Tracker for the date. The function creates that date's
   `daily_duties` the first time the page requests them.

If using the Supabase CLI, link this folder to the project and deploy only this
function; do not use `--prune` because this folder does not contain the other
functions that may already be deployed:

```powershell
supabase login
supabase link --project-ref kulmkrqoadsoaocuovpe
supabase functions deploy runtime-test --project-ref kulmkrqoadsoaocuovpe
```

Each rota row keeps a display name in `assigned_name`. Leave `assigned_to`
empty until the person's Firebase UID is known. The “My duties” view filters
by UID; the leadership “All duties” view shows the full display-name roster.
For example, the source roster assigns “Ahmed” to Monday Lesson 7 in the New
Building Corridor (13:25–14:15). Link that row to Ahmed's verified Firebase UID
before expecting it to appear in his personal view.
