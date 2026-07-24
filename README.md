# SkyAbove

Interactive night-sky viewer: planets, bright stars, Moon, and Sun drawn for your location (or a place you pick).

## Features

- **Live sky map** — zenith-centered dome with altitude/azimuth projection
- **Your location** — browser geolocation, plus city search
- **Time travel** — scrub date/time, jump to now, or replay the last 6 hours
- **Celestial bodies** — Sun, Moon (with phase), Mercury–Neptune, bright stars, and the **ISS** when it crosses your sky
- **Day / twilight / night** — sky tone follows solar altitude

## Run locally

```bash
npm install
npm run dev
```

Then open the URL Vite prints (usually `http://localhost:5173`).

## Build

```bash
npm run build
npm run preview
```

## Stack

- React + TypeScript + Vite
- [astronomy-engine](https://github.com/cosinekitty/astronomy) for positions and Moon phase
- Canvas 2D renderer

## Data

Bright-star RA/Dec/magnitude live in `src/data/stars.ts`. Positions are computed in `src/astronomy.ts`.

## Live site

https://skylight-production-4337.up.railway.app

## Source of truth & deploy

There is **one source of code** and **one user-facing deploy**:

| Role | Where |
| --- | --- |
| Source of truth | GitHub `asujeff48/SkyLight`, branch **`main`** |
| Production (users) | Railway service **skylight**, environment **production**, tracking **`main`** |

**Rule:** if it is not on `main`, it is not in production.

### How changes go live

1. Push commits to GitHub (feature branch is fine while working).
2. **Merge into `main`** when the change is ready for users. Do not leave finished work only on a PR branch.
3. Railway **autodeploys** from `main` — wait for the deployment to show Success.
4. Hard-refresh the live URL before testing.

Do not treat Railway CLI uploads, local builds, or unmerged branches as production. GitHub `main` → Railway is the only path.
