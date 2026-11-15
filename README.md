# Municipal Complaint Management System

`municipal-complaints` — a civic complaint reporting and resolution platform for
Pakistani municipalities.

> [!WARNING]
> **This project is in very early alpha (pre-release).**
> It is incomplete, unstable, and should not be used in production or for real
> municipal operations. APIs, data models, and file layout are all subject to
> breaking changes without notice. Expect missing features, bugs, and
> unfinished code.

A web application built for **Pakistan**, where citizens report municipal issues
(roads, water, waste, lighting, etc.) to their local government and municipal
staff triage and resolve them.

The project is currently at the scaffolding stage: the authentication and staff
account layer is in place, while the complaint domain itself has not been
implemented yet.

---

## Status

| Area | State |
| --- | --- |
| Registration, login, JWT sessions | Implemented |
| Role-based access control (`citizen`, `officer`, `admin`) | Implemented |
| One-time initial admin bootstrap | Implemented |
| Admin staff account provisioning | Implemented |
| Complaint model, submission, tracking, status workflow | **Not started** |
| Frontend application (any real screens) | **Not started** — placeholder page only |
| Automated tests | **None** |

See [Known issues](#known-issues) for the current limitations.

---

## Tech stack

**Backend**

- Express 5
- Mongoose 9 / MongoDB
- JSON Web Tokens (`jsonwebtoken`) and `bcryptjs`
- Zod validation
- Helmet, CORS, Morgan, `express-rate-limit`
- Executed with [Bun](https://bun.sh)

**Frontend**

- React 19
- Vite 8
- Tailwind CSS 4
- React Compiler (via Babel plugin)
- Oxlint

---

## Repository layout

```
.
├── backend/
│   ├── server.js                 # Express entry point
│   ├── .env.example              # Required environment variables
│   └── src/
│       ├── config/db.js          # Mongoose connection
│       ├── models/               # User, Bootstrap
│       ├── controllers/          # auth, admin
│       ├── routes/               # auth, admin
│       ├── middleware/           # protect, authorize
│       └── validators/           # Zod schemas
└── frontend/
    ├── vite.config.js
    └── src/                      # React app (placeholder)
```

---

## Getting started

> Reminder: none of this is production ready. Use a local or throwaway database.

### Prerequisites

- [Bun](https://bun.sh) installed
- A MongoDB instance (local or Atlas)

### 1. Backend

```bash
cd backend
bun install
cp .env.example .env
```

Edit `backend/.env` and set `MONGODB_URI`, a strong `JWT_SECRET`, and (optionally)
`ADMIN_BOOTSTRAP_KEY` if you want to create the first administrator through the
API.

```bash
bun run dev     # restart on change
bun run start   # plain start
```

The API listens on `http://localhost:5000` by default.

### 2. Frontend

```bash
cd frontend
bun install
bun run dev
```

The Vite dev server runs on `http://localhost:5173`, which matches the default
`CLIENT_URL` used by the backend's CORS configuration.

### 3. Create the first administrator

1. `GET /api/auth/bootstrap-status` — check whether setup is available.
2. `POST /api/auth/bootstrap-admin` with `name`, `email`, `password`, and
   `bootstrapKey`.
3. Further staff accounts are created by an admin via
   `POST /api/admin/accounts`.

---

## API overview

All responses follow the shape `{ success, message?, data?, errors? }`.

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/health` | Public | Health check; `503` when the database is down |
| `POST` | `/api/auth/register` | Public | Citizen self-registration |
| `POST` | `/api/auth/login` | Public | Obtain a JWT |
| `GET` | `/api/auth/me` | Authenticated | Current user profile |
| `GET` | `/api/auth/bootstrap-status` | Public | Is initial admin setup available? |
| `POST` | `/api/auth/bootstrap-admin` | Public + bootstrap key | Create the first admin once |
| `GET` | `/api/admin/accounts` | Admin | List officer/admin accounts |
| `POST` | `/api/admin/accounts` | Admin | Create an officer/admin account |

Rate limits: authentication routes allow 10 requests per 15 minutes; the rest of
`/api` allows 100 per 15 minutes.

---

## Known issues

The project is alpha, so this list is expected to shrink quickly.

- The frontend is a single placeholder component with no API client, routing, or
  auth screens.
- There is no automated test suite and no CI.

---

## Roadmap

Near-term work, roughly in order:

1. Add the complaint domain: model, categories, statuses, priority, attachments.
2. Complaint APIs: submit, list, filter, assign, update status, comment.
3. Frontend: routing, auth pages, citizen submission and tracking, officer and
   admin dashboards.
4. Tests, CI, and a deployment path.

---

## License

Not decided yet. Treat the code as all rights reserved until a license is added.
