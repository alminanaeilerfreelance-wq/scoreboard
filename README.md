# CourtCast 🏀

Full-stack basketball scoreboard built with **Next.js 14 (App Router) + MongoDB**.

Three views, one shared live database:

- **`/`** — Admin dashboard. Configure tournament, teams, rules, rosters. Auto-saves to MongoDB.
- **`/scoreboard`** — Operator console. Run the live game: scoring, fouls, timeouts, subs, clocks.
- **`/audience`** — Big-screen read-only display. Polls live for venue projector / livestream overlay.

All views see the same MongoDB-backed state. Open the scoreboard on the scorer's table laptop and `/audience` on the venue TV — they sync live.

---

## 1. Prerequisites

- **Node.js** 18.17 or later
- A **MongoDB** database. Two easy options:
  - **Free hosted**: [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) — create a free M0 cluster, hit "Connect" → "Drivers" → copy the connection string.
  - **Local**: install MongoDB Community Edition, run `mongod`, use `mongodb://localhost:27017`.

## 2. Install

```bash
npm install
```

## 3. Environment

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

```env
MONGODB_URI=mongodb+srv://<user>:<pass>@<cluster>.mongodb.net
MONGODB_DB=courtcast
```

## 4. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — the admin dashboard seeds default teams and rules into MongoDB on first request.

## 5. Production

```bash
npm run build
npm start
```

Deploy to Vercel: push to GitHub, import the repo, add `MONGODB_URI` and `MONGODB_DB` as environment variables, deploy.

---

## How the data flows

```
┌─────────────────┐      ┌──────────────────┐      ┌─────────────────┐
│  /  (admin)     │─────▶│  /api/config     │─────▶│  config         │
│                 │─────▶│  /api/teams      │─────▶│  teams          │
│                 │      │                  │      │                 │
│  /scoreboard    │─────▶│  /api/match/     │─────▶│  match          │
│  (operator)     │      │    launch        │      │                 │
│                 │─────▶│  /api/match/     │─────▶│                 │
│                 │      │    event         │      │                 │
│                 │◀─────│  /api/match  GET │◀─────│   MongoDB       │
│  /audience      │◀─────│  /api/match  GET │◀─────│                 │
│  (read-only)    │      │  (poll 1s)       │      │                 │
└─────────────────┘      └──────────────────┘      └─────────────────┘
```

Every collection has a single document with `_id: 'main'` — the app is a single-match operator console rather than a multi-tenant league system. To support multiple concurrent matches, swap the `_id: 'main'` constants for actual match IDs and add a match-list page.

## API routes

| Route | Method | Purpose |
|---|---|---|
| `/api/config` | `GET`, `PUT` | Read or replace the match-rule config |
| `/api/teams` | `GET`, `PUT` | Read or replace the two team rosters |
| `/api/match` | `GET`, `PUT` | Read current match state; PUT applies partial patches (used for periodic clock persistence) |
| `/api/match/launch` | `POST` | Validates teams and creates a fresh match document |
| `/api/match/event` | `POST` | Applies a game action via the canonical reducer and saves |
| `/api/match/reset` | `POST` | Wipes everything back to defaults |

Game actions accepted by `/api/match/event`:
- `JUMP_BALL_START` — tip off
- `TOGGLE_CLOCK` — pause/resume game clock
- `RESET_SHOT { short: bool }` — reset shot clock to 24 or 14
- `SET_POSSESSION { team }` — switch arrow
- `SELECT_PLAYER { team, playerId }` — pick the active scorer
- `SCORE { team, points }` — record 1/2/3 points for the selected player
- `UNDO_SCORE { team }` — undo last score
- `FOUL { team, foulType }` — record a foul on the selected player
- `TIMEOUT { team }` — call a timeout
- `SUB { team, outId, inId }` — substitute players
- `NEXT_QUARTER` — advance the period (auto-routes to OT or FINAL)

## File structure

```
src/
├── app/
│   ├── api/
│   │   ├── config/route.js       — GET/PUT config
│   │   ├── teams/route.js        — GET/PUT teams
│   │   ├── match/
│   │   │   ├── route.js          — GET/PUT match
│   │   │   ├── event/route.js    — POST action
│   │   │   ├── launch/route.js   — POST launch
│   │   │   └── reset/route.js    — POST reset
│   ├── page.js                   — Admin dashboard
│   ├── scoreboard/page.js        — Operator console
│   ├── audience/page.js          — Big-screen display
│   ├── layout.js
│   └── globals.css
├── components/
│   └── Scoreboard.jsx            — Shared scoreboard primitives
├── hooks/
│   └── useMatch.js               — Polling + dispatch hook
└── lib/
    ├── mongodb.js                — MongoClient singleton
    ├── defaults.js               — Seed data + validators
    └── matchReducer.js           — Game-state reducer (server-side authoritative)
```

## Notes & next steps

- **Polling vs WebSockets**: this MVP uses 1-second polling on the audience display and 1.5s on the scoreboard. For lower latency, swap `useMatch` polling for a `/api/match/stream` Server-Sent Events route.
- **Auth**: not included. Add NextAuth or simple basic auth on the admin/scoreboard routes before exposing this publicly.
- **Match history**: the schema overwrites the same document each match. To save match history, change `_id: 'main'` to `_id: <new ObjectId>` per launch and add an `/api/matches` index route.
- **Multi-screen sync**: opening `/scoreboard` on multiple devices works — both will see the canonical state — but two operators clicking simultaneously will race. For multi-operator setups, lock the scoreboard route behind a single login.
