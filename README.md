# To Do List

A full-stack To Do List application: a React + TypeScript SPA backed by an Express + TypeScript REST API, with per-user auth and SQLite storage.

## Summary of the assignment

The brief asked for a full-stack To Do List app where a user logs in and performs full CRUD on their own tasks, with a REST-style backend, standard HTTP status codes, and a responsive UI supporting search and manual reordering of tasks, plus a dedicated task detail screen for viewing/editing. Code quality, test coverage, and clean REST design were explicitly called out as grading criteria.

## Approach

- **Backend** (`server/`): Express + TypeScript, SQLite via `better-sqlite3` for zero-dependency persistence, JWT + bcrypt for auth. Business logic lives in small service factories (`createAuthService`, `createTasksService`) that take a `Db` handle as a dependency, so the same code path is exercised by both the running server and the Supertest integration tests (against an isolated in-memory database per test file) — no mocking of the database layer needed. Requests are validated with `zod` schemas via a small validation middleware; a centralized error handler is the only place that logs (genuine 5xx errors, not debug output).
- **Frontend** (`client/`): React + TypeScript on Vite. Auth state lives in a small `AuthContext` (token persisted to `localStorage`, attached to every API call by the `api/client.ts` fetch wrapper). Routing is handled by `react-router-dom`, with a `ProtectedRoute` guard on `/tasks/*`. Task reordering uses `@dnd-kit` (pointer *and* keyboard sensors, so it's usable without a mouse); the actual array-splicing logic is a small pure function (`lib/arrayMove.ts`) so it's unit-testable independent of drag events. Search is debounced client-side and answered by the backend's `?search=` query param, so it scales the same way a "real" list would.
- **Monorepo**: npm workspaces (`server`, `client`) with a root `package.json` exposing `dev`/`build`/`test`/`lint` that fan out to both workspaces.

### REST API

| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/api/auth/register` | — | `{email, password}` → 201 `{token, user}`; 400 on invalid input or duplicate email |
| POST | `/api/auth/login` | — | `{email, password}` → 200 `{token, user}`; 401 on bad credentials |
| GET | `/api/tasks?search=` | required | 200 `[task]`, scoped to the caller, ordered by position |
| POST | `/api/tasks` | required | `{title, description?}` → 201 task |
| GET | `/api/tasks/:id` | required | 200 task; 404 if missing or owned by another user |
| PUT | `/api/tasks/:id` | required | `{title, description?, completed}` → 200 updated task |
| DELETE | `/api/tasks/:id` | required | 204 |
| PATCH | `/api/tasks/reorder` | required | `{orderedIds: string[]}` → 200 `[task]` |

Auth is a `Bearer <jwt>` header, checked by `requireAuth` middleware (401 if missing/invalid). A task that exists but belongs to another user returns **404**, not 403 — a deliberate choice to avoid confirming another user's task ID exists at all.

## Features completed

- Sign up / log in (JWT + bcrypt), sessions persisted across reloads
- Full CRUD on tasks, scoped per-user at the data layer (not just the UI)
- Dedicated task detail screen for both create and edit, reused as one form component
- Search (debounced, server-backed)
- Manual reordering via drag-and-drop, with keyboard support
- Responsive layout (usable from small mobile widths up)
- Centralized validation (400) and error handling (401/404/500) on the API
- Backend integration tests (Supertest) covering auth, CRUD, search, reorder, and cross-user isolation
- Frontend unit/component tests (Vitest + React Testing Library) covering the reorder helper, session persistence, and the task list's search/toggle/delete flows
- Dockerfiles for both services + a `docker-compose.yml` for a one-command local run
- AWS deployment (Terraform) and GitHub Actions CI/CD (test on every push/PR, then build/push/deploy on `main`) — see `infra/`

## Running it locally (macOS)

**Prerequisites:** Node.js 20+ and npm 10+ (`node -v`, `npm -v`). Install via [nvm](https://github.com/nvm-sh/nvm) or `brew install node` if you don't have them.

```bash
# from the repo root
npm install
cp server/.env.example server/.env   # defaults are fine for local dev

npm run dev
```

This starts the API on `http://localhost:4000` and the Vite dev server on `http://localhost:5173` (which proxies `/api/*` to the backend, so the browser only ever talks to one origin). Open `http://localhost:5173`, sign up, and start adding tasks. SQLite data is written to `server/data.sqlite` and survives restarts.

**Running tests:**

```bash
npm test          # runs server (Jest/Supertest) and client (Vitest/RTL) suites
npm run lint       # ESLint across both workspaces
npm run build      # type-checks and builds both workspaces for production
```

## Running it with Docker

```bash
docker compose up --build
```

This builds the API image (Node, `server/Dockerfile`) and the client image (static build served by nginx, `client/Dockerfile`, proxying `/api` to the `server` container), and starts both — the app is then available at `http://localhost:5173`. Set a real `JWT_SECRET` via a `.env` file at the repo root (`JWT_SECRET=...`) before running this outside of local development; it defaults to a placeholder otherwise.

## Deploying to the cloud (bonus)

`infra/` contains a working Terraform + GitHub Actions setup that deploys both containers
to a single AWS EC2 instance, with CI/CD fully automated: every push to `main` runs the
test suite, builds and pushes both images to ECR, and triggers a zero-downtime redeploy —
see **[`infra/README.md`](infra/README.md)** for the full architecture and setup steps.
Highlights: `JWT_SECRET` is generated by Terraform and stored in SSM Parameter Store
(never touches GitHub); GitHub Actions authenticates to AWS via OIDC, so no AWS access
keys are stored as GitHub secrets; and there's no SSH key pair anywhere — deploys and any
manual shell access both go through AWS Systems Manager.

If you'd rather not use AWS, both pieces are plain containers and any container host
works just as well: push `server/Dockerfile` to [Fly.io](https://fly.io),
[Render](https://render.com), or [Railway](https://railway.app) (set `JWT_SECRET` and a
persistent volume at `DB_PATH`), and deploy the static `client/dist/` build to
[Vercel](https://vercel.com) or [Netlify](https://www.netlify.com).

## Given more time

**Features I'd add (~1–2 days total):**
- Password reset / email verification flow (~4h) — needs a transactional email provider, which is why it's out of scope here.
- Pagination or virtualization for large task lists (~3h) — the search endpoint already scales, but the client fetches the full result set today.
- Tags/labels and due dates on tasks (~4h) — straightforward schema + UI addition, skipped to keep the core CRUD/auth/reorder/search loop the focus.
- End-to-end tests with Playwright covering the real drag-and-drop interaction and full login→CRUD→logout flow (~4h) — the current test suite intentionally covers reorder logic and the reorder endpoint separately, since simulating real pointer-drag events in jsdom is unreliable.
- Optimistic UI for create/update (currently only reorder is optimistic) (~2h).

**For more robustness in production:**
- Refresh tokens + shorter-lived access tokens, instead of a single 7-day JWT.
- Rate limiting on `/api/auth/*` to blunt credential-stuffing attempts.
- A real migrations tool (e.g. `node-pg-migrate` or Prisma migrate) instead of the current `CREATE TABLE IF NOT EXISTS` bootstrap, once there's more than one schema version to manage.
- Structured request logging (e.g. `pino`) and basic request tracing, instead of only logging unhandled errors.
- A Dependabot/renovate config for dependency updates, and branch protection requiring the CI workflow to pass before merge.
- Swapping SQLite for a managed Postgres instance for real multi-instance deployments (SQLite's single-writer model is fine for this exercise but not for horizontal scaling) — see `infra/README.md`'s "known tradeoffs" for what else would need to change to get there (a load-balanced ECS/Fargate setup instead of a single EC2 instance, a domain + TLS, automated backups).
