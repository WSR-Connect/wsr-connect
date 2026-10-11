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

## Girls' corridor rota source and automatic sync

The current source is the `CORRIDOR DUTY (GIRLS)` tab in Ahmed's official copy
of the Google Sheet `2027 SRC Duty Rotations` (spreadsheet ID
`1N6RMXBu7zAMVsAERXfiWmleeGXpjBK9tAbsPG3pNPOY`). It contains 64 assignments:
seven lessons in each corridor Monday through Thursday, and four lessons on
Friday. The sync code checks the weekday headings, required cells, fixed lesson
times, and same-lesson double assignments. It rejects incomplete or conflicting
sheets without changing Supabase.

Keep the official copy restricted to the intended school editors before relying
on it as the school's source of truth.

For an already-populated project, run
`sync_latest_girls_corridor_changes.sql` once in the Supabase SQL Editor to
apply the three assignment changes already present in the sheet. It refreshes
future pending duties while preserving completed history and clears an old
account link if a student's name changes.

To install edit-triggered sync from the Supabase and Google web dashboards:

1. Run `migrations/20261005120000_sync_girls_corridor_rota.sql` in the Supabase
   SQL Editor. It creates a transaction-safe RPC restricted to `service_role`.
2. Create a Supabase Edge Function named `sync-girls-corridor` from
   `functions/sync-girls-corridor/index.ts`. Turn gateway JWT verification off;
   the function checks its own shared secret and accepts only the configured
   spreadsheet and tab. Add a strong random `ROTA_SYNC_SECRET` under Edge
   Function secrets. Do not put that value in source control.
3. In the spreadsheet, open Extensions → Apps Script and add the code from
   `scripts/girls-corridor-rota-sync.gs`. Add the same secret as a Script
   Property named `ROTA_SYNC_SECRET`.
4. Run `installGirlsCorridorRotaSync` once and approve Google's requested
   spreadsheet-read and outbound-request permissions. The installable edit
   trigger syncs changes to assignment cells; the “Duty tracker” menu also has
   a manual sync command.

The Apps Script sends only the girls' corridor assignment fields. The Supabase
service-role key stays inside the Edge Function. Sync updates or creates the
recurring rota rows, pauses obsolete girls' rows, preserves completed duties,
and refreshes future pending duties. It does not map display names to Firebase
accounts; leadership still links each account in Rota Manager.
