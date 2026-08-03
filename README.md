# DevTrack

A single-user project management tool for tracking projects, requirements, bugs,
a shared backlog, and time — built for one developer keeping their own work
straight, not for a team.

FastAPI + PostgreSQL on the back, React + Vite + Tailwind on the front.

---

## What it does

| Area | What you get |
|---|---|
| **Projects** | CRUD, deadlines, and a derived completion percentage |
| **Requirements** | Per-project, with priority, status and backlog flag |
| **Bugs** | Per-project, optionally linked to a requirement, with an **append-only status history** |
| **Backlog** | One combined view of every requirement and bug flagged *In Backlog*, across all projects |
| **Time Logs** | Day / Week / Month calendar with colour-coded days; hours derived from the start→end span |
| **Dashboard** | Project cards with progress and the single most important open requirement, over a month calendar |
| **Reports** | Six aggregate stats plus per-project progress |
| **Settings** | Workday hour target and tracking start date, stored in `localStorage` |

### Two rules worth knowing

**Progress is never stored.** It is always derived as
`(Done requirements + Fixed bugs) / (total requirements + total bugs) × 100`.
The formula lives in exactly one function (`progress_from_counts`) so the
per-project endpoint and the batched dashboard query cannot drift apart.

**Bug status history is append-only.** Status changes only ever go through
`POST /bugs/{id}/status`, which appends a row. The CRUD layer deliberately
exposes no update or delete for history rows.

---

## Requirements

- Python 3.12+
- Node 20.19+ or 22.12+ — required by Vite 8, which is stricter than most tooling
- PostgreSQL 14+ (developed against 18.4)

---

## Setup

### 1. Database

Create the database in `psql`:

```sql
CREATE DATABASE devtrack;
```

### 2. Backend

```bash
cd devtrack/backend
python -m venv venv
.\venv\Scripts\Activate.ps1      # Windows PowerShell
# source venv/bin/activate       # macOS / Linux
pip install -r requirements.txt
```

Create `devtrack/backend/.env`:

```
DATABASE_URL=postgresql://postgres:<your-password>@localhost:5432/devtrack
```

> If your password contains `@`, `#`, `/` or `:`, URL-encode it —
> `#` becomes `%23`, `@` becomes `%40`. An unencoded character silently
> truncates the connection string and produces a confusing auth error.

Apply the migrations, then optionally seed a sample project:

```bash
alembic upgrade head
python -m app.seed          # optional
```

### 3. Frontend

```bash
cd devtrack/frontend
npm install
```

---

## Running

Two terminals.

**Backend** — http://localhost:8000

```bash
cd devtrack/backend
.\venv\Scripts\Activate.ps1
uvicorn app.main:app --reload --port 8000
```

**Frontend** — http://localhost:5173

```bash
cd devtrack/frontend
npm run dev
```

Interactive API docs are at **http://localhost:8000/docs**.

The `Activate.ps1` step is not optional — without it you may run a system
Python that happens to have FastAPI installed but ignores the pinned versions
in `requirements.txt`.

Vite hot-reloads everything **except `tailwind.config.js`**; change that file
and restart the dev server.

---

## Project structure

```
devtrack/
├── backend/
│   ├── alembic/versions/     9 hand-written migrations
│   └── app/
│       ├── models/           SQLAlchemy 2.0 (Mapped / mapped_column)
│       ├── schemas/          Pydantic v2 — Base / Create / Update / Read
│       ├── crud/             All DB access; routers never query directly
│       ├── routers/          HTTP layer: validation, status codes
│       ├── database.py       Engine, SessionLocal, get_db dependency
│       └── seed.py
└── frontend/src/
    ├── api/                  One thin module per resource
    ├── components/           Shared UI (Card, Modal, Badge, calendars…)
    ├── hooks/                useWorkdaySettings (localStorage-backed)
    ├── pages/                One per route
    └── utils/                Pure date + layout helpers — no React imports
```

`utils/` is deliberately React-free so the trickiest logic (timezone-safe date
strings, the 42-cell month grid, overlap packing for the hour grid) can be
exercised directly under Node without a test runner.

---

## API

Everything is under `/api/v1`.

| Method | Endpoint | Notes |
|---|---|---|
| `GET` | `/projects` | |
| `POST` | `/projects` | 422 on blank or duplicate name |
| `GET` `PUT` `DELETE` | `/projects/{id}` | |
| `GET` | `/projects/{id}/progress` | Derived, never stored |
| `GET` `POST` | `/requirements` | `?project_id=` to filter |
| `GET` `PUT` `DELETE` | `/requirements/{id}` | |
| `GET` `POST` | `/bugs` | `?project_id=` to filter |
| `GET` `PUT` `DELETE` | `/bugs/{id}` | `PUT` cannot change status |
| `POST` | `/bugs/{id}/status` | The only way to change status; appends history |
| `GET` | `/bugs/{id}/history` | Full timeline |
| `GET` `POST` | `/timelogs` | `?from=`, `?to=`, `?date=`, `?project_id=` |
| `GET` `PUT` `DELETE` | `/timelogs/{id}` | `hours` is derived, never accepted |
| `GET` | `/dashboard` | Project cards + top requirement |
| `GET` | `/backlog` | Combined requirements + bugs |
| `GET` | `/reports` | Aggregate stats |

---

## Design notes

A few decisions that look odd until you know why:

- **Postgres enums store values, not member names.** `Enum(...)` is passed a
  `values_callable` so the DB holds `'Not Started'` rather than `'NOT_STARTED'`.
  Removing it breaks every enum write.
- **Time logs survive project deletion.** `time_logs.project_id` is
  `ON DELETE SET NULL`; requirements, bugs and bug history all cascade.
- **Overnight time entries are rejected** by a `CHECK (end_time > start_time)`.
  A midnight-crossing block would have to be split across two day columns in
  the hour grid — log two entries instead.
- **Dates are built from `getFullYear/getMonth/getDate`, never
  `toISOString()`.** At a positive UTC offset, local midnight is the previous
  day in UTC, so `toISOString().slice(0,10)` shifts every date by one.
- **A failed fetch never renders as an empty list.** "No bugs yet" during an
  outage is the most misleading message a bug tracker can show, so load
  failures get their own state with a Retry.
- **Theme colours are semantic tokens** (`bg-card`, `text-fg-muted`,
  `border-line`) defined once in `tailwind.config.js`, not raw palette classes
  spread across components.

---

## Known limitations

Honest list — these are deliberate, not oversights:

- **`requirements_done_this_week` is approximate.** Requirements have no status
  history table, only `updated_at`, which any edit touches. A requirement
  finished months ago but retitled today will count. The equivalent bug stat is
  exact, because bugs *do* keep a history. Fixing this needs a
  `requirement_status_history` table.
- **The topbar search is inert.** There is no search endpoint; it is styled as
  a disabled affordance rather than an input that silently does nothing.
- **Requirements and bugs cannot be deleted from the UI.** The API supports it;
  the UI spec never included the action.
- **Single user, no authentication.** There is no login, and the API is
  unauthenticated — run it locally only.
- **Desktop only.** Laid out for ≥1024px; no mobile work has been done.

---

## Development

```bash
cd devtrack/frontend && npm run lint     # oxlint
cd devtrack/backend  && alembic upgrade head
```

Migrations are hand-written. Do not trust a bare `alembic revision
--autogenerate` here — the enum types are shared across tables, and autogenerate
will try to re-create ones that already exist.

`project_docs/` holds the original PRD, TRD, UI/UX and schema specs. They are
kept **frozen as a historical record**; where the code has since diverged, the
code is the source of truth and the difference is noted in a comment near the
relevant function.
