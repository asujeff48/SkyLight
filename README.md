# SkyAbove

Interactive night-sky viewer: planets, bright stars, Moon, and Sun drawn for your location (or a place you pick).

## Features

- **Live sky map** — zenith-centered dome with altitude/azimuth projection
- **Your location** — browser geolocation, plus city presets
- **Time travel** — scrub date/time or jump to now
- **Celestial bodies** — Sun, Moon (with phase), Mercury–Neptune, and a bright-star catalog
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
