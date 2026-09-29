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
