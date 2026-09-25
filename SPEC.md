# Implementation Plan

This document is the implementation plan drawn up before writing any code, kept here as a record of the intended design and how it maps to what was actually built.


## Repo layout

npm workspaces monorepo:

```
/todo-list
  package.json            # root: workspaces + concurrently dev/test/lint scripts
  README.md                # deliverable: setup, approach, tradeoffs, future work
  docker-compose.yml        # bonus: local multi-container run
  server/
    package.json
    tsconfig.json
    Dockerfile
    .env.example            # JWT_SECRET, PORT, DB_PATH
    src/
      index.ts              # app bootstrap, listens on PORT
      app.ts                 # express app (routes+middleware), exported for supertest
      db.ts                   # better-sqlite3 connection + schema migration (users, tasks tables)
      middleware/
        auth.ts                # requireAuth: verifies Bearer JWT, attaches req.userId -> 401 on failure
        errorHandler.ts        # centralized error -> {400,401,404,500} JSON mapping
        validate.ts             # zod schema validation middleware -> 400 with field errors
      routes/
        auth.routes.ts          # POST /api/auth/register, POST /api/auth/login
        tasks.routes.ts         # /api/tasks CRUD + reorder + search, all requireAuth-guarded
      services/
        auth.service.ts         # bcrypt hash/compare, JWT sign/verify, user CRUD queries
        tasks.service.ts        # task CRUD + reorder + search queries, scoped by userId
      schemas/
        auth.schema.ts          # zod: register/login body
        tasks.schema.ts         # zod: create/update/reorder body
    tests/
      auth.test.ts             # supertest: register/login happy paths + validation/duplicate/401 cases
      tasks.test.ts            # supertest: CRUD, search, reorder, cross-user isolation (404 not 403)
  client/
    package.json
    tsconfig.json
    vite.config.ts            # dev proxy: /api -> http://localhost:4000
    src/
      main.tsx / App.tsx        # router setup
      api/
        client.ts                # fetch wrapper: base URL, attaches Authorization header, throws on !ok
        auth.ts, tasks.ts        # typed API calls
      context/AuthContext.tsx   # token/user state, persisted in localStorage, login/register/logout
      routes/ProtectedRoute.tsx
      pages/
        LoginPage.tsx, RegisterPage.tsx
        TaskListPage.tsx          # list + search box + drag-reorder + create button
        TaskDetailPage.tsx        # view/edit/create form (id param optional -> create mode)
      components/
        TaskItem.tsx, TaskForm.tsx, SearchBar.tsx
      hooks/
        useDebouncedValue.ts      # for search input
      lib/
        arrayMove.ts              # pure reorder helper, unit tested
      styles/                     # CSS modules, small shared variables (spacing/colors), responsive via flex/grid + media queries
    tests/
      arrayMove.test.ts
      TaskListPage.test.tsx        # RTL: render, search filters, create/edit/delete flows (mocked API)
      AuthContext.test.tsx         # login/logout persists+clears token
```

## Data model (SQLite)

```sql
users(id TEXT PK, email TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL, created_at TEXT)
tasks(id TEXT PK, user_id TEXT FK->users.id, title TEXT NOT NULL, description TEXT,
      completed INTEGER DEFAULT 0, position INTEGER NOT NULL, created_at TEXT, updated_at TEXT)
```
`position` is a per-user integer used to order the list; reordering rewrites `position` for the affected user's tasks in one transaction.

## REST API

| Method | Path | Notes |
|---|---|---|
| POST | /api/auth/register | `{email, password}` -> 201 `{token, user}`; 400 on invalid/duplicate email |
| POST | /api/auth/login | `{email, password}` -> 200 `{token, user}`; 401 on bad credentials |
| GET | /api/tasks?search= | 200 `[task]`, scoped to caller, ordered by `position`, optional case-insensitive title/description filter |
| POST | /api/tasks | `{title, description?}` -> 201 task, appended to end of caller's list |
| GET | /api/tasks/:id | 200 task; 404 if missing or owned by another user |
| PUT | /api/tasks/:id | `{title, description, completed}` -> 200 updated task; 404 as above |
| DELETE | /api/tasks/:id | 204; 404 as above |
| PATCH | /api/tasks/reorder | `{orderedIds: string[]}` -> 200 `[task]`; validates the set matches caller's task ids exactly |

All `/api/tasks*` routes require `Authorization: Bearer <jwt>` (401 if missing/invalid). Cross-user access returns 404 (not 403) to avoid leaking existence of other users' tasks — documented as a deliberate choice in the README.

## Frontend UX flow

Landing page is `/login` (with a link to `/register`). After login, `/tasks` shows the list with a search box (debounced 300ms, hits `GET /api/tasks?search=`) and drag-to-reorder (via `@dnd-kit/core` + `@dnd-kit/sortable`, which include a keyboard sensor for accessibility) calling `PATCH /api/tasks/reorder` on drop. Each task links to `/tasks/:id` for view/edit, and `/tasks/new` reuses the same form component for create. Layout uses flexbox/grid with breakpoints so it's usable from mobile widths up.

## Testing approach

- Backend: Jest + ts-jest + Supertest against the real Express app with an isolated SQLite DB per test run (temp file or in-memory), covering auth (register/login/validation/duplicates), task CRUD, search, reorder, and cross-user isolation.
- Frontend: Vitest + React Testing Library, mocking the API client — covers the pure `arrayMove` helper, `AuthContext` token persistence, and `TaskListPage` create/search/edit/delete flows. Drag-and-drop pointer interaction itself is not simulated in jsdom (known limitation); the reorder *logic* is unit tested via `arrayMove` and the reorder endpoint is integration-tested on the backend.
- Where practical, tests are written before implementation for core service/route logic (register/login, task CRUD, reorder) per TDD.

## Tooling / deliverable polish

- ESLint (typescript-eslint + eslint-plugin-react-hooks) and Prettier, config'd once and applied to both workspaces.
- `.env.example` checked in; no secrets committed.
- Centralized Express error handler — only genuine 5xx errors are logged (no debug/console.log left in code, no TODO/FIXME comments).
- Root scripts: `npm install`, `npm run dev` (concurrently runs server on :4000 + client on :5173 with proxy), `npm test`, `npm run build`.
- `Dockerfile` per workspace + root `docker-compose.yml` for a one-command local run, plus README notes on deploying server (Render/Fly.io/Railway) and client (Vercel/Netlify) as the cloud-deployment bonus — actual deployment stays optional per the brief.

## Verification

- `npm test` at root runs both workspaces' suites; all green.
- `npm run dev`, then manually exercise: register -> login -> create/edit/delete/search/reorder tasks -> logout -> confirm `/tasks` redirects to `/login` -> log back in and confirm data persisted (SQLite file survives restart).
- `npm run build` succeeds for both workspaces (TS type-checks clean).
