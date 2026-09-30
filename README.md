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
