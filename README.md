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

The project is currently at the scaffolding stage: authentication, a staff console,
and administrator/officer account provisioning are in place, while the complaint
domain itself has not been implemented yet.

---

## Status

| Area | State |
| --- | --- |
| Registration, login, JWT sessions | Implemented |
| Role-based access control (`citizen`, `officer`, `admin`) | Implemented |
| One-time initial admin bootstrap | Implemented |
| Admin staff account provisioning | Implemented (create and list) |
| Staff console UI (sign in, initial setup, provisioning) | Implemented |
| Complaint model, submission and browsing | Implemented |
| Citizen UI (register, report, nearby, my reports, track) | Implemented |
| Optional map pin on complaints | Implemented |
| Officer queue and admin complaint console | Implemented |
| Assignment, status workflow and notes | Implemented |
| Comments and attachments | **Not started** |
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
- Leaflet + OpenStreetMap tiles for the location picker
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
│       ├── config/complaint.js   # Categories, statuses, priorities (edit here)
│       ├── models/               # User, Bootstrap, Complaint, Counter
│       ├── controllers/          # auth, admin, complaints
│       ├── routes/               # auth, admin, complaints
│       ├── middleware/           # protect, authorize
│       └── validators/           # Zod schemas
└── frontend/
    ├── vite.config.js            # Dev server + /api proxy to the backend
    └── src/
        ├── lib/api.js            # Fetch wrapper and ApiError
        ├── lib/format.js         # Date and relative-time helpers
        ├── context/              # AuthProvider, AuthContext, useAuth
        ├── components/ui.jsx     # Card, Button, fields, alerts, badges
        ├── components/ComplaintCard.jsx
        ├── components/LocationPicker.jsx
        ├── components/StaffComplaintControls.jsx
        ├── components/StaffShell.jsx
        ├── pages/AuthPage.jsx    # Sign in, citizen registration, first-admin setup
        ├── pages/CitizenApp.jsx  # Citizen portal shell and tabs
        ├── pages/ReportComplaintPage.jsx
        ├── pages/ComplaintsFeedPage.jsx
        ├── pages/TrackComplaintPage.jsx
        ├── pages/AdminApp.jsx    # Complaints + staff accounts
        ├── pages/OfficerApp.jsx  # My queue + unassigned
        ├── pages/StaffComplaintsPage.jsx
        ├── pages/StaffAccountsPage.jsx
        └── App.jsx               # Session and role routing
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

Edit `backend/.env` and set `MONGODB_URI`, a strong `JWT_SECRET`, and
`ADMIN_BOOTSTRAP_KEY` if you want to create the first administrator from the
console.

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

The Vite dev server runs on `http://localhost:5173` and proxies `/api` to the
backend, so no CORS setup is needed in development. Open it in a browser.

For other deployments, set `VITE_API_URL` (for example
`VITE_API_URL=https://api.example.gov.pk`) at build time; when it is empty the app
uses same-origin requests.

### 3. Sign in and create accounts

1. If no administrator exists yet and `ADMIN_BOOTSTRAP_KEY` is set, the sign-in
   screen offers **Create the first administrator**. Use the key from the
   environment.
2. Sign in; administrators land on **Staff accounts**.
3. Create officer or administrator accounts with a temporary password and share
   it with the staff member securely.
4. The same endpoints are available directly: `GET`/`POST /api/admin/accounts`.

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
| `GET` | `/api/complaints/meta` | Public | Categories, statuses and priorities |
| `GET` | `/api/complaints` | Authenticated | Browse complaints, filter by area |
| `POST` | `/api/complaints` | Authenticated | Submit a complaint |
| `GET` | `/api/complaints/:reference` | Authenticated | One complaint by reference |
| `PATCH` | `/api/complaints/:reference` | Officer/admin | Assign, change status, add a note |

Rate limits: authentication routes allow 10 requests per 15 minutes; the rest of
`/api` allows 100 per 15 minutes.

### CORS

`CLIENT_URL` accepts a comma-separated list of browser origins, for example
`http://localhost:5173,https://complaints.example.gov.pk`. Behaviour:

- In development, any `localhost` or `127.0.0.1` port is also allowed, so Vite can
  fall back to `5174` when `5173` is taken.
- Requests without an `Origin` header (curl, server-to-server) are allowed.
- Any other browser origin receives `403 Origin ... is not allowed by CORS`.
- Preflight responses are cached for 10 minutes, and the `RateLimit*` headers are
  exposed so the browser can read throttling information.

### Complaints

- Categories, statuses and priorities live in one file:
  `backend/src/config/complaint.js`. Add, rename or retire an entry there —
  validation, `/api/complaints/meta` and the UI all follow with no other changes.
- References look like `MUN-2026-000001`, generated from an atomic counter.
- Citizens can see other people's complaints in their area, but the reporter is
  shown as a masked display name such as `Zaid K.` — never an email, user id or
  internal history. Officers and administrators see the full record.
- A complaint can carry an optional pin: `"location": { "lat": 31.52037,
  "lng": 74.35875 }`. Citizens pick it on an OpenStreetMap panel, use their
  device location, or skip it. Cards link to the pin and the tracking page
  shows it on a read-only map.
- List filters: `status`, `category`, `area`, `priority`, `mine=true`,
  `assigned=mine`, `assigned=unassigned`, `page`, `limit` (maximum 50).
  Results are newest first.

### Dispatch

- Administrators see every complaint, can assign or unassign it, and can change
  status with an optional note.
- Officers have two queues: their own assigned work and the unassigned pool.
  An officer can claim an unassigned complaint for themselves, then change its
  status. They cannot take or update another officer's complaint.
- Every assignment, status change and note is appended to the complaint history
  with the acting staff member and timestamp. Citizens see the resulting status
  but not internal notes or reporter contact details.
- Staff cards link to the pin in OpenStreetMap and offer Google Maps directions,
  so a dispatched officer can navigate straight to the spot.

---

## Known issues

The project is alpha, so this list is expected to shrink quickly.

- There are no comments, attachments or notifications yet, and the history trail
  is only visible in the API, not in the UI.
- Account provisioning is deliberately minimal: no editing, deactivation,
  password reset, search or pagination yet.
- There is no automated test suite and no CI.

---

## Roadmap

Near-term work, roughly in order:

1. Show the complaint history trail to staff and expose a citizen-friendly
   progress view.
2. Comments, photo attachments and notifications.
3. Area-level reporting and workload summaries.
4. Tests, CI, and a deployment path.

---

## License

Not decided yet. Treat the code as all rights reserved until a license is added.
