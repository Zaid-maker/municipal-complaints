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

Citizens report through a mobile-first portal that can be installed like an app,
while officers and administrators work in a wider staff console. Complaint
submission, dispatch, status updates, photo evidence and anti-spam are in place.
An installable PWA and a citizen-only build are ready; a native Capacitor app is
planned once the API is deployed over HTTPS.

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
| Photo attachments on complaints | Implemented (JPEG/PNG/WebP) |
| Complaint anti-spam (rate limit, daily cap, duplicate check, honeypot) | Implemented |
| Installable PWA (manifest, service worker, icons) | Implemented |
| Citizen-only build (`dev:citizen` / `build:citizen`) | Implemented |
| Native Android app (Capacitor) | Scaffolded; no APK build yet |
| Deployment to a public HTTPS API | Implemented on Render (early alpha) |
| Comments and notifications | **Not started** |
| Automated tests | **None** |

See [Known issues](#known-issues) for the current limitations.

---

## Tech stack

**Backend**

- Express 5
- Mongoose 9 / MongoDB
- JSON Web Tokens (`jsonwebtoken`) and `bcryptjs`
- Zod validation
- Multer for photo uploads
- Helmet, CORS, Morgan, `express-rate-limit`
- Executed with [Bun](https://bun.sh)

**Frontend**

- React 19
- Vite 8
- Tailwind CSS 4
- Leaflet + OpenStreetMap tiles for the location picker
- React Compiler (via Babel plugin)
- Oxlint
- Hand-written web app manifest and service worker (no PWA plugin)

---

## Repository layout

```
.
├── render.yaml                   # Render Blueprint: API + static PWA
├── backend/
│   ├── server.js                 # Express entry point
│   ├── .env.example              # Required environment variables
│   └── src/
│       ├── config/db.js          # Mongoose connection
│       ├── config/complaint.js   # Categories, statuses, priorities (edit here)
│       ├── config/uploads.js     # Upload folder, size and type limits
│       ├── config/spam.js        # Report rate, daily and duplicate limits
│       ├── models/               # User, Bootstrap, Complaint, Counter
│       ├── controllers/          # auth, admin, complaints
│       ├── routes/               # auth, admin, complaints
│       ├── middleware/           # protect, authorize, upload, rate limiting
│       ├── services/             # duplicate and quota checks
│       └── validators/           # Zod schemas
└── frontend/
    ├── index.html               # PWA metadata, theme color, app shell
    ├── capacitor.config.json    # Capacitor app id, webDir, splash settings
    ├── .env.android             # Public API URL and citizen-only flag for the APK
    ├── assets/                  # Source icon and splash PNGs for capacitor-assets
    ├── android/                 # Capacitor Android project (committed)
    ├── public/
    │   ├── manifest.webmanifest # PWA identity, icons, display mode
    │   ├── sw.js                # Shell-only service worker
    │   ├── favicon.svg
    │   └── icons/               # 192, 512, maskable and Apple touch icons
    ├── vite.config.js           # Dev/preview /api and /uploads proxy
    └── src/
        ├── lib/api.js            # Fetch wrapper and ApiError
        ├── lib/format.js         # Date and relative-time helpers
        ├── lib/native.js         # Splash, status bar, native detection
        ├── context/              # AuthProvider, AuthContext, useAuth
        ├── components/ui.jsx     # Card, Button, fields, alerts, badges
        ├── components/ComplaintCard.jsx
        ├── components/AttachmentGrid.jsx
        ├── components/ComplaintPhotoUpload.jsx
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
        └── App.jsx               # Session, role routing and citizen-only gate
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

The Vite dev server runs on `http://localhost:5173` and proxies `/api` and
`/uploads` to the backend, so no CORS setup is needed in development. Open it in
a browser.

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

### 4. Install it as a citizen app (PWA)

The frontend ships a hand-written manifest and service worker, so the citizen
portal installs from the browser — no store review and no separate codebase.

```bash
cd frontend
bun run build          # full app: citizens and staff
bun run build:citizen  # citizen-only bundle
bun run preview        # serve dist on http://localhost:4173
```

Open `http://localhost:4173` in Chrome or Edge, then use the install button in
the address bar (or **Install app** in the browser menu). On iOS, open the site
in Safari and choose **Share → Add to Home Screen**.

What to keep in mind:

- The service worker registers only in a production build, so `bun run dev`
  keeps its normal hot reload.
- It caches the app shell (`/`, `index.html`, the manifest and icons) plus
  content-hashed build assets. It never caches `/api` responses or `/uploads`
  photos, so complaint data and private images always come from the network.
- Installing and offline shell loading require HTTPS (or `localhost`).
- `bun run dev:citizen` and `build:citizen` use Vite's `citizen` mode. In that
  mode officer and administrator sessions are stopped with a **This app is for
  citizens** screen, and staff keep using the full web console.
- The citizen build gates staff screens at runtime; it does not yet remove them
  from the JavaScript bundle.
- The same production build can be wrapped by Capacitor later, so this is not
  throwaway work.

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
| `POST` | `/api/complaints/:reference/attachments` | Assigned officer/admin | Upload 1–5 photos (`multipart/form-data`, field `photos`) |
| `DELETE` | `/api/complaints/:reference/attachments/:attachmentId` | Assigned officer/admin | Remove one photo and its file |
| `GET` | `/uploads/complaints/:filename` | Public | Stored complaint photo |

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

### Anti-spam

Complaint submission has four layers, all configurable in `backend/.env`:

| Layer | Default | Purpose |
| --- | --- | --- |
| Burst rate limit | 5 reports / 10 min per account | Stops rapid-fire flooding |
| Rolling daily cap | 15 reports / 24 h per account | Caps sustained spam |
| Duplicate check | Same title + category by the same account in 24 h | Returns `409` with the existing reference |
| Honeypot | Hidden `website` field | Rejects bots that fill every input |

- Rate limiting is keyed by account id, not IP, so a shared office or household
  connection is not punished for one person's reports.
- Duplicate detection normalizes case, punctuation and spacing before comparing
  titles. The response points the citizen at the report they already filed.
- The limits live in `backend/src/config/spam.js`; tune them with
  `COMPLAINT_RATE_LIMIT`, `COMPLAINT_RATE_WINDOW_MS`,
  `COMPLAINT_DAILY_LIMIT` and `COMPLAINT_DUPLICATE_WINDOW_MS`.
- Registration and login are already rate-limited separately per IP.

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

### Photos

- The assigned officer or an administrator can attach photos to a complaint to
  document the problem or the completed fix. Citizens can see the photos too.
- Limits: JPEG, PNG or WebP only; up to 5 photos per request; 5 MB per photo.
  These live in `backend/src/config/uploads.js`.
- Files are written to `backend/uploads/complaints/` by default and served from
  `/uploads/complaints/<file>`. The folder is git-ignored and created on start.
  Set `UPLOAD_ROOT` to move it to a mounted volume on a host with an ephemeral
  filesystem.
- Each upload is recorded in the complaint history as `Added N photo(s)`, and
  photo bytes are deleted again if the database write fails.
- The assigned officer or an administrator can remove a photo. The subdocument
  and file are deleted, and `Removed 1 photo` is appended to the history.

---

## Deployment

The app is live on Render's free static CDN with a paid Starter API instance:

- Web / PWA: <https://municipal-web.onrender.com>
- API: <https://your-api.onrender.com> (`/api/health`)

`render.yaml` provisions both services together. The generic settings below
apply to any other host.

### Deploy to Render (one Blueprint)

`render.yaml` creates two services:

| Service | What it is | Cost |
| --- | --- | --- |
| `municipal-api` | Bun/Express API with a 1 GB persistent disk | Starter (~$7/mo) + $0.25/GB disk |
| `municipal-web` | React/Vite PWA on Render's global CDN | Free |

Render has no managed MongoDB, so the database lives on MongoDB Atlas (free M0
is enough for a pilot).

1. **Create the Atlas cluster first.** Choose AWS and the region that matches
   Render's `singapore` region (`ap-southeast-1`). Create a database user, allow
   Render's outbound IPs under **Network Access** (or `0.0.0.0/0` while
   testing), and copy the driver connection string. Add the database name, for
   example `.../municipal_complaints?retryWrites=true&w=majority`.
2. **Apply the Blueprint.** In Render, choose **New → Blueprint**, connect
   `Zaid-maker/municipal-complaints`, and apply. Render asks for `MONGODB_URI`
   because it is marked `sync: false`; paste the Atlas string.
3. **Wait for both deploys.** The API is healthy at
   `https://municipal-api-xxxx.onrender.com/api/health`; the app is at
   `https://municipal-web-xxxx.onrender.com`.
4. **Set CORS once.** Copy the `municipal-web` URL, open `municipal-api` →
   **Environment**, add `CLIENT_URL` with that exact origin, and save. A
   Blueprint cannot read a static site's generated `onrender.com` URL, so this
   one value has to be pasted by hand. Comma-separate it if you add a custom
   domain, a second frontend or the Android/Capacitor app
   (`...,https://localhost,capacitor://localhost`).
5. **Create the first administrator.** Open the web URL, choose **Create the
   first administrator**, and use `ADMIN_BOOTSTRAP_KEY` from
   `municipal-api` → **Environment**. Then create staff accounts and register
   citizens.
6. **Install the PWA** from the browser's install button and test it on a
   phone.

Notes:

- `JWT_SECRET` and `ADMIN_BOOTSTRAP_KEY` are generated by Render and never
  committed. Reveal them in the dashboard when needed.
- If the browser reports `No 'Access-Control-Allow-Origin' header`, `CLIENT_URL`
  is missing or does not exactly match the frontend origin. Set it and redeploy
  the API; changes to environment variables alone do not reload a running
  instance.
- The Blueprint sets `JWT_EXPIRES_IN=30d` because there are no refresh tokens
  yet. Shorten it if 30 days is too generous.
- `UPLOAD_ROOT=/var/data/uploads` writes photos to the disk, so they survive
  deploys. A disk pins the API to one instance and briefly stops it during each
  deploy (no zero-downtime), which is fine at this scale.
- **Free pilot:** change the API `plan` to `free` and delete the `disk` block in
  `render.yaml`. Photos will then disappear on every deploy or idle spin-down,
  and the API sleeps after 15 idle minutes. Use that only for demos.
- The static site builds the full app so citizens and staff share one URL. To
  add a separate citizen-only app later, create another static site with
  `bun run build:citizen` and append its URL to `CLIENT_URL`.
- Custom domains: add them to both services in Render, then list the frontend
  origin in `CLIENT_URL`.
- Render includes Bun because both packages have a `bun.lock`; `BUN_VERSION`
  pins 1.4.4.
- `/api/health` is registered before the API rate limiter so Render's frequent
  probes do not consume the 100-request budget.

### Backend

Set these in the host's environment panel, never in a committed file:

| Variable | Purpose |
| --- | --- |
| `NODE_ENV` | `production` |
| `MONGODB_URI` | Managed MongoDB (Atlas or a private instance) |
| `JWT_SECRET` | Long random string; never reuse the example |
| `CLIENT_URL` | Comma-separated browser origins, e.g. `https://complaints.example.gov.pk` |
| `UPLOAD_ROOT` | Folder on a persistent disk/volume for photos |
| `TRUST_PROXY` | `1` when behind Render, Railway, Nginx or another proxy |
| `ADMIN_BOOTSTRAP_KEY` | Optional one-time first-admin setup |

- Run `bun server.js` (or `bun run start`) behind the platform's HTTPS proxy.
- Uploaded photos must survive redeploys. On hosts with an ephemeral filesystem,
  attach a volume and point `UPLOAD_ROOT` at it; otherwise every release wipes
  photo evidence.
- `TRUST_PROXY` makes Express read the forwarded client IP, which the login and
  API rate limits depend on.
- Add every deployed frontend origin to `CLIENT_URL`, or browsers receive
  `403 Origin ... is not allowed by CORS`.
- Run MongoDB with authentication and restrict network access to the API host.
- Take a database backup before inviting real citizens.

### Frontend

```bash
cd frontend
VITE_API_URL=https://api.example.gov.pk bun run build         # citizens + staff
VITE_API_URL=https://api.example.gov.pk bun run build:citizen # citizen app
```

Serve `dist/` over HTTPS. If the frontend and API share an origin, proxy `/api`
and `/uploads` to the backend and leave `VITE_API_URL` empty; `bun run preview`
already proxies those paths so a local preview matches production.

The PWA needs HTTPS for installability, service worker registration and
geolocation. The manifest and service worker are plain files in `public/`, so no
extra build step or plugin is involved.

### Android app (Capacitor)

The citizen app is scaffolded under `frontend/android` as a Capacitor 8 project
(`pk.gov.municipal.complaints`). It wraps the citizen-only build, so officer and
admin screens never ship in the APK.

```powershell
cd frontend
bun run native:sync   # build:android, then cap sync android
bun run native:open   # open the project in Android Studio
bun run native:run    # build and install on a device or emulator
```

- `bun run build:android` writes `dist-citizen/` using Vite's `android` mode.
  That mode sets `VITE_CITIZEN_ONLY=true` and reads `VITE_API_URL` from
  `frontend/.env.android`. Update that value if the API host changes.
- The native shell skips service worker registration (the bundle is already
  local) and hides the splash screen after React's first paint.
- Icons and splash images come from `frontend/assets/` via
  `bunx capacitor-assets generate --android`. Replace those PNGs to rebrand.
- Location uses the WebView's `navigator.geolocation`. Capacitor requests the
  runtime permission, and the manifest declares coarse and fine location;
  denial falls back to tapping the map.
- The generated `android/` project is committed, but copied web assets under
  `android/app/src/main/assets/public/` are ignored and recreated by sync.

Building an APK needs JDK 21 and Android SDK 36 (Android Studio). The project
uses minSdk 24, targetSdk 36.

Before the app can call the API, append the Capacitor origins to the API's
`CLIENT_URL` on Render:

```
https://municipal-web.onrender.com,https://localhost,capacitor://localhost
```

`https://localhost` is the Android origin because `androidScheme` is `https`.
`capacitor://localhost` covers iOS if that platform is added later. Saving the
variable needs a redeploy; health checks pass without it but every API call
from the app will fail CORS.

Not done yet: a signed release build, app-store listing, camera use (citizens do
not upload photos; officer photo tools stay on the web), push notifications, and
back-button exit confirmation. The Android app uses the API's 30-day JWT, so
refresh tokens can wait until the first public release.

---

## Known issues

The project is alpha, so this list is expected to shrink quickly.

- There are no comments or notifications yet, and the history trail is only
  visible in the API, not in the UI.
- Photo attachments cannot be edited or replaced, and uploads rely on local
  disk rather than object storage.
- Anti-spam is deliberately basic: no CAPTCHA, email verification or
  administrator account suspension yet.
- The PWA has no “new version available” prompt; a reload picks up a new shell,
  and old caches are cleared when the new worker activates.
- The citizen-only build gates staff screens at runtime rather than removing
  them from the bundle. The Android shell is scaffolded but not yet built or
  signed, and there is no push notification or offline complaint queue.
- iOS has no install prompt; citizens must use **Share → Add to Home Screen**.
- The live deployment uses Render's Starter API with a 1 GB disk and Atlas M0.
  There are no database backups, uptime alerts or off-site copies of photos yet,
  and `CLIENT_URL` must be updated by hand if the frontend URL changes.
- Account provisioning is deliberately minimal: no editing, deactivation,
  password reset, search or pagination yet.
- There is no automated test suite and no CI.

---

## Roadmap

Near-term work, roughly in order:

1. Harden the live deployment: Atlas backups, uptime alerts, disk monitoring and
   an off-site copy of uploaded photos.
2. Finish the Android wrapper: signed release build, device testing and a store
   listing; iOS follows when a Mac/Xcode is available.
3. Show the complaint history trail to staff and expose a citizen-friendly
   progress view.
4. Comments, notifications and photo captions/replacements.
5. Account suspension and stronger verification for repeat spam accounts.
6. Area-level reporting and workload summaries.
7. Tests, CI, and a deployment pipeline.

---

## License

Not decided yet. Treat the code as all rights reserved until a license is added.
