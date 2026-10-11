# WSR Connect

WSR Connect is the school community website and SRC portal for GEMS Westminster
School – RAK. It includes public announcements, events, the SRC directory,
duty information, resources, feedback, and authenticated SRC and leadership
tools.

## Run locally

1. Install a current Node.js LTS release.
2. Install packages with `npm ci`.
3. Copy `.env.example` to `.env.local` and fill in the Supabase project URL and
   publishable key.
4. Start the development server with `npm run dev`.

Useful commands:

```powershell
npm run dev
npm run lint
npm run build
```

## Configuration

The frontend reads these values from `.env.local`:

| Variable | Purpose |
| --- | --- |
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Browser-safe Supabase publishable key |

Never put a Supabase service-role key or `ROTA_SYNC_SECRET` in a `VITE_` variable
or frontend source. Keep backend secrets in Supabase Edge Function secrets; the
girls' rota Apps Script keeps its matching sync secret in Script Properties.

## Supabase setup

Database migrations, Edge Functions, seed instructions, and spreadsheet sync
setup are documented in [`supabase/README.md`](supabase/README.md).

## Deployment

The GitHub Actions workflow in `.github/workflows/deploy.yml` builds the site and
deploys it to GitHub Pages when changes reach `main`. Add `VITE_SUPABASE_URL`
and `VITE_SUPABASE_PUBLISHABLE_KEY` as repository Actions secrets. The Vite
base path is configured in `vite.config.ts` for the `/wsr-connect/` project URL.

## Project layout

- `src/auth/` — Firebase sign-in and route protection
- `src/components/` — reusable UI components and SRC profiles
- `src/data/` — public SRC and duty data
- `src/portal/` — authenticated SRC and leadership pages
- `src/lib/` — Firebase and Supabase clients
- `supabase/` — SQL, Edge Functions, and backend setup notes
- `scripts/` — Google Apps Script for rota synchronization
