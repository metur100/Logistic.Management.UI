# LogistiTrack Web

React 18 + TypeScript + Vite frontend for the LogistiTrack transport operations
platform.

## Design

- Custom design system in `src/index.css` (ink/paper/signal-orange palette,
  Manrope + IBM Plex Mono).
- Lucide icons only — no emoji.
- Responsive app shell: permanent sidebar on desktop, off-canvas drawer on
  mobile, and an app-style bottom bar for drivers.
- Responsive tables become labelled cards on phones.
- No page-level horizontal scrolling; verified at 390 × 844 with Puppeteer.
- Public company registration and driver invite acceptance screens.

## Run

```bash
npm install
npm run dev
```

By default the dev server talks to `http://localhost:5099/api`. Override with:

```bash
VITE_API_BASE_URL=https://your-api/api npm run build
```

In production the fallback API is `https://logistic-management.runasp.net/api`.

## Build

```bash
npm run build
```

Cloudflare Pages deploys `dist` through `.github/workflows/deploy.yml`.

## Screens

- `/login`, `/register`, `/accept-invite/:token`
- `/management` — dashboard, transports, calendar, cargo, fleet, drivers,
  messages, incidents, support, company settings
- `/admin` — platform overview, companies, company analysis, users, support,
  platform settings
- `/driver` — home with Start route, transports, calendar, messages, incidents,
  support

## Roles

The UI is role-separated: managers never see platform admin pages, admins never
see company operations, drivers see only their own work.


