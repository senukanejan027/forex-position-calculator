# Position Size Calculator

Client-side forex position size calculator (React + Vite). Supports EURUSD, GBPUSD, USDJPY, XAUUSD.

## Run
    npm install
    npm run dev
    npm test      # calculation checks
    npm run build

## Deploy to GitHub Pages
1. Push to a GitHub repo on the `main` branch.
2. Settings > Pages > Source: GitHub Actions.
3. The workflow in `.github/workflows/deploy.yml` builds and publishes `dist`.

The build uses relative asset paths, so it works at `https://USERNAME.github.io/REPOSITORY-NAME/` without config changes.

## Editing instruments
All specs live in `src/data/instruments.js`. USDJPY converts JPY pip value to USD with a reference rate in that file (no live data); update it occasionally.

## Design system
- All colours live in `src/styles.css` section 1 as CSS variables, defined once for `[data-theme='dark']` and once for `[data-theme='light']`. Change a token there and both themes and every page follow.
- Theme: `index.html` sets `data-theme` before first paint (saved choice, else the OS setting, else dark). The choice is saved under the `snfx-theme` localStorage key. Journal data still uses `fx-journal`, unchanged.
- Font: Geist, self-hosted through `@fontsource-variable/geist` (no Google Fonts request). Icons: `lucide-react` (tree-shaken).
- Shared pieces: `Toast` (`useToast()`), `EmptyState`, `ThemeToggle`, and `Modal` (Escape, focus trap, exit animation; `footer` may be a function receiving `close`).
- The Economic Calendar is Myfxbook's embedded widget. Its inside is styled by Myfxbook and cannot be themed from this site; only the frame around it follows the theme.

## SNFX Cloud (Supabase accounts + cloud journal)
Calculator, Sessions and Economic Calendar need no account. The Trading Journal needs one; trades are saved per user in Supabase and cached in the browser.

1. Create a free project at supabase.com.
2. SQL Editor: run `supabase/schema.sql` (adds the table, the extra journal columns, and Row Level Security so each user sees only their own trades).
3. Authentication > URL Configuration: set Site URL to your site (`https://USERNAME.github.io/REPO/`) and add it plus `http://localhost:5173/` to Redirect URLs. Email confirmation links and password resets return there.
4. Local development: copy `.env.example` to `.env` and fill in the Project URL and the publishable (anon) key. `.env` is git-ignored.
5. GitHub Pages: repository Settings > Secrets and variables > Actions, add `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`. The deploy workflow passes them to the build.

Only the publishable key is ever used in the browser. Never add a `service_role` key to this project. Without the two variables the site still builds and the journal shows a "not set up" notice.
