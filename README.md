# DMU Smart Welcome — University Freshmen Onboarding Platform

## Latest update: one sidebar button and digits-only telephone inputs

- **One menu control:** The three-line button in the top header opens and closes navigation on **desktop and mobile**. The sidebar no longer contains an X button. On desktop, hiding navigation gives the content the full width. On mobile, the same three-line button stays above the drawer when it opens, allowing it to close it.
- **Telephone field:** The profile and administrator student-editor use the same input component. Non-digit keypresses and text insertion are blocked; pasted values are sanitised; 15 digits is the maximum. A submitted number must contain **7–15 digits**, and the server separately enforces this constraint. An empty phone field remains optional.
- **Existing accounts:** An old value that contains letters is cleaned in the profile editor. Save the profile to replace the outdated record with the clean number.

### Important: replacing source files is not enough for Docker

Your old screenshot showed the **X** and the old **Phone number** label. That means the browser was viewing an earlier frontend build. Extract this ZIP into **`D:\Business\Thesis\Tonmoy\Project\`** (the parent directory), replacing the old `dmu-smart-welcome` files. **Do not** extract into the already existing `dmu-smart-welcome` folder, as that could create a nested folder and leave Docker building the old source. Then run these commands in Windows Command Prompt:

```cmd
cd /d "D:\Business\Thesis\Tonmoy\Project\dmu-smart-welcome"
docker compose build --no-cache web api
docker compose up -d --force-recreate web api
```

Then open **http://localhost:8080**, press **Ctrl+Shift+R** and sign in if needed. To confirm you are on this update, the phone label should read **Telephone number (7-15 digits)** and there should be **no X button** below the logo at any size. Do **not** run `docker compose down -v`, because that would remove your database volume.

Alternatively, double-click `update-windows.bat` from the extracted project folder; it runs the same rebuild commands.

## Latest navigation update

- The sidebar no longer contains **Switch to admin demo** or **Switch to student demo**. **Sign out** remains visible at the bottom.
- On a student session, select the **avatar or full name in the top-right corner** of the page to open **My Profile**. This link is keyboard-accessible and works when the mobile layout shows only the avatar.
- Administrative access still requires signing out and logging in with an administrator account. This does not bypass role-based permissions.

## Fixes in this edition — profile validation and navigation

- **Telephone field:** accepts only 7–15 digits, with a hard 15-digit typing limit. The API separately rejects text, symbols, spaces, and invalid lengths.
- **Birth / expected arrival:** birth dates cannot be in the future; expected arrival cannot predate the student's birth. The browser date pickers are constrained and the API enforces the same chronology. Invalid calendar dates are also rejected.
- **Applications:** the student page clearly explains that the form is for *simulating an onboarding information submission and review*, not applying for a real university admission or enrolment.
- **Sidebar:** the three-line button expands/collapses the sidebar on wide screens and opens/closes a drawer on phones/tablets. No X button appears in the sidebar; the three-line button closes the mobile drawer as well. Menu links can scroll independently while **Sign out** stays accessible.
- **Student profile shortcut:** click the student avatar or name at the right of the top navigation bar to open **My Profile**.
- **Separate account access:** to sign into an administrator account, first sign out and then use the admin demo credentials on the login screen. The student and administrator roles remain isolated.

### Update an existing Docker installation on Windows

Extract this complete archive over the old source folder and run in the project directory:

```cmd
cd /d "D:\Business\Thesis\Tonmoy\Project\dmu-smart-welcome"
docker compose up --build -d --force-recreate
```

Then open `http://localhost:8080`, hard-refresh with **Ctrl+Shift+R**, and sign in again. The seed migration updates the old Aisha demo record to Mithil Mahbub without losing associated records. **Do not run `docker compose down -v`** unless you deliberately intend to delete the database volume.

### Additional checks

```cmd
node tests/profile-navigation.mjs
node tests/chatbot.mjs
node tests/smoke.mjs
```

The tests exercise server-side phone/date validation and check the new account-switching/navigation paths. Final responsive browser checks should be performed locally after Docker rebuild, as availability of npm and Docker image registries depends on the environment.


**De Montfort University–inspired academic project | Leicester, United Kingdom**

A full-stack, locally runnable implementation of **Design and Implementation of University Freshmen Smart Welcome Platform**, adapted to the academic project contract provided by the student. This build is a **demonstration**, not an official De Montfort University website or a live admissions, housing, or student-records service.

## Academic project information

| Detail | Information from supplied documents |
| --- | --- |
| University | **De Montfort University**, Leicester, United Kingdom |
| Faculty | Faculty of Computing, Engineering and Media |
| Degree | Computer Science BSc (Hons) |
| Project author | Mithil Mahbub |
| Project supervisor | Bernice Bryan |
| Module code (from template) | CTEC3451 |
| Project title | Design and Implementation of University Freshmen Smart Welcome Platform |

**Sources for university details:** The provided project contract identifies the project title, author, degree subject, supervisor and full feature set. The provided *Thesis Template.docx* contains the university identity, logo, faculty, degree designation, and module code. Its sample thesis topic is **network anomaly detection**; that unrelated subject has **not** been applied to this freshmen onboarding platform.

This website uses the De Montfort University logo extracted from the user-provided thesis template. Its UI design, sample accommodation categories, intakes (`2026/27 (demo)`), announcements, sample student records, registration statuses and guidance are illustrative. They are **not** verified university policies, dates, course listings, admissions requirements, or residence inventory.

The technology stack is **React.js + Vite, Node.js + Express.js, MySQL, JWT authentication and role-based access control**. It includes student and admin dashboards, account registration/login, profile updates, applications, document upload/review, accommodation requests, password-reset approvals, announcements, and a **rule-based English FAQ assistant** (not a generative AI service).

> **Privacy and safety:** Never upload real passports, transcripts, photographs, or other sensitive personal information to an internet-exposed demo. Never reuse demo passwords on real accounts. The prototype should undergo an independent security and privacy review before any real deployment. For actual DMU enrolment, housing or deadlines, use official university channels.

## Recommended: run with Docker (one command)

Prerequisites: [Docker Desktop](https://www.docker.com/products/docker-desktop/) with Docker Compose. Make sure ports **8080** and **3307** are free.

1. Extract the ZIP into a folder.
2. Open a terminal in the extracted `dmu-smart-welcome` directory.
3. Run:

   ```bash
   docker compose up --build -d
   ```

4. Open **http://localhost:8080** in your browser.
5. At the login page, select **Student demo** or **Admin demo** to fill in the credentials, then click **Sign in**.

First startup downloads the Node, Nginx and MySQL images, builds the website and initializes the database. If the page is initially unavailable, check `docker compose logs -f` for startup messages.

To stop the app:

```bash
docker compose down
```

The database and uploaded files persist in Docker volumes. Because this updated package uses the folder name `dmu-smart-welcome`, it normally receives separate Docker volumes from the previous `ntu-smart-welcome` project. The backend also migrates exact old demo-branding strings if you deliberately reuse the earlier database. To erase **all** demo records and uploads and reset the environment (destructive):

```bash
docker compose down -v
```

**Windows shortcut:** double-click `start-windows.bat` after starting Docker Desktop. **macOS/Linux shortcut:** run `./start.sh`.

### Demo logins

| Role | Email | Password |
| --- | --- | --- |
| Administrator | `admin@welcome.test` | `Admin123!` |
| Student (Mithil) | `mithil@welcome.test` | `Student123!` |
| Student (Daniel) | `daniel@welcome.test` | `Student123!` |
| Student (Sofia) | `sofia@welcome.test` | `Student123!` |
| Student (Amara) | `amara@welcome.test` | `Student123!` |

You can also register a new student account. Only the backend creates administrator accounts (the demo admin is seeded when no demo admin exists).

**Updated Mithil demo profile:** The first sample student is now **Mithil Mahbub**, `mithil@welcome.test`, **Bangladesh**, **Computer Science**, student number **DMU-DEMO-001**. The demo password remains `Student123!`.

### Upgrading an existing installation (important)

If you previously ran the version using `aisha@welcome.test`, **back up your project folder first**, then extract this ZIP into the same parent directory and replace the existing source files inside `dmu-smart-welcome` (rather than creating a second, differently named directory). Run:

```bash
docker compose up --build -d
```

The API automatically migrates the original demo student **in place** from Aisha to Mithil at startup. Existing applications and accommodation requests stay attached to the same student ID. After rebuilding, **sign out**, refresh the website, then use `mithil@welcome.test` / `Student123!`. The old `aisha@welcome.test` login will no longer work. **Do not run `docker compose down -v`** just to update: that command deletes all data volumes.

If a student already registered with `mithil@welcome.test` before upgrading, the migration skips the duplicate-email update and logs a warning instead of overwriting or deleting either account. Resolve that account conflict manually before retrying.

### Fix for the white-screen chatbot issue (October 2026 update)

This release replaces the old chatbot message rendering with a fault-isolated React component. It avoids `scrollIntoView()` on a fixed widget, scrolls only the message area, and adds user question + answer in a single state update. All 12 FAQs work locally without making an API request. It also includes a chat recovery display so an exception cannot remove the dashboard.

**On Windows with an existing installation:** replace your existing project source files with this ZIP, keeping your existing `dmu-smart-welcome` folder name. Make sure you are in the folder containing `docker-compose.yml` and run:

```cmd
 docker compose build --no-cache web
 docker compose up -d --force-recreate web
```

Or rebuild all services with `docker compose up --build -d`. After the container is running, use `Ctrl+Shift+R` in your browser at `http://localhost:8080` or test in a private/incognito window. **Do not run `docker compose down -v`** because that removes all your demo records and uploads.

### Interactive Welcome Assistant

- Open **Ask Welcome** in the bottom-right corner of the student portal.
- Click **How to apply?**, **Required documents**, or **Accommodation** to get an immediate answer.
- Start typing (e.g. `app`, `doc`, `accom`, `password`, `status`) to see matching built-in questions. Click any suggestion to send it and get the matching response. You can also use **Up/Down arrows + Enter** to pick a highlighted suggestion.
- You can type your own question and press Enter or the Send icon. Answers are generated immediately from local, predefined rule-based guidance. The chat does not need an API request to display its replies.
- The assistant is not generative AI and does not supply confirmed DMU admissions, accommodation, or deadline advice.


## Run without Docker

Prerequisites: Node.js **20+**, npm and MySQL **8.x**. You need **two terminals**. Make sure your MySQL server is running.

1. Create the database and database user using a MySQL administrator account:

   ```sql
   CREATE DATABASE smart_welcome CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   CREATE USER 'welcome_user'@'localhost' IDENTIFIED BY 'welcome_dev_password';
   GRANT ALL PRIVILEGES ON smart_welcome.* TO 'welcome_user'@'localhost';
   ```

   If your MySQL host/port is different, edit the environment file accordingly. **Change these development credentials** when using anything except your local computer.

2. Backend terminal:

   ```bash
   cd server
   cp .env.example .env
   npm install
   npm run dev
   ```

   On Windows Command Prompt use `copy .env.example .env` instead of `cp`. In `server/.env`, replace `JWT_SECRET` with a random secret of **at least 32 characters**. The server automatically creates tables from `server/schema.sql` and inserts demonstration records on the first start. API: **http://localhost:4000/api/health**.

3. Frontend terminal:

   ```bash
   cd client
   npm install
   npm run dev
   ```

4. Open **http://localhost:5173**.

The Vite development server forwards `/api/*` requests to `http://localhost:4000`.

### Local MySQL on Docker port 3307

If you run only the `db` container with `docker compose up -d db` and run Node directly on your host, configure `DB_PORT=3307` in `server/.env`, because Docker exposes MySQL on localhost port 3307.

## How to use the website

### Student workflow

1. Register or sign in; complete **My Profile** (nationality, contact, faculty, academic details).
2. Under **Applications**, create a draft, edit it and submit it; monitor the status and staff feedback.
3. Under **Documents**, upload fictional or redacted sample passport, transcript, certificate and photograph files (PDF, JPG, PNG, WEBP; maximum 8 MB). See review results, download or delete eligible uploads.
4. Under **Accommodation**, request a room type, select preferred residence and expected move-in date; review decisions and assigned room.
5. The **Dashboard** automatically updates onboarding milestones and progress. See announcements and use the rule-based **Welcome Assistant**.
6. If you cannot access your account, use **Forgot password?** to request a reset with a proposed new password. An administrator must verify identity before approving it.

### Administrator workflow

1. Log in using the demo admin credentials.
2. Review the overview's registration counts and pending work.
3. Inspect and edit student records under **Students**.
4. Review applications, request changes, approve or reject them.
5. Download and verify documents; add staff feedback when needed.
6. Review housing applications and optionally assign room numbers.
7. Review password reset requests **only after an external identity check**.
8. Publish and remove announcements visible to students.

### Statuses

- Applications: `draft`, `pending`, `in_review`, `changes_requested`, `approved`, `rejected`
- Documents: `pending`, `verified`, `rejected`
- Accommodation: `pending`, `approved`, `rejected`
- Password resets: `pending`, `approved`, `rejected`

## Project structure

```text
dmu-smart-welcome/
├── docker-compose.yml         # MySQL + Express API + Nginx/Vite build
├── start.sh                   # macOS/Linux Docker helper
├── start-windows.bat          # Windows Docker helper
├── client/
│   ├── Dockerfile
│   ├── nginx.conf             # Serves React app and proxies /api
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   ├── public/favicon.svg
│   └── src/
│       ├── App.jsx           # Authentication, routing, navigation, chatbot
│       ├── chatKnowledge.js # Built-in FAQ answers and typing suggestions
│       ├── StudentPages.jsx  # Student features
│       ├── AdminPages.jsx    # Administrator features
│       ├── ui.jsx            # Reusable controls
│       ├── api.js            # Authenticated API helper
│       ├── main.jsx
│       └── styles.css        # Responsive design
└── server/
    ├── Dockerfile
    ├── package.json
    ├── .env.example
    ├── schema.sql            # Database tables, indexes, relationships
    └── src/
        ├── db.js            # Database connection and demo seed
        ├── index.js         # REST endpoints, JWT, file handling, security
        └── chatbot.js       # Keyword-based onboarding assistance
```

## Security measures implemented

- `bcrypt` password hashing with work factor 12.
- Signed JWT access tokens; 12-hour expiry; server-side role checks for each protected route.
- Parameterized MySQL queries; request validation and controlled field updates.
- Rate limits on login, registration, and password recovery requests.
- HTTP security headers through Helmet.
- Private file storage outside the web root, authenticated file download, content checks, 8 MB file limit, restricted file formats.
- Administrator-mediated password reset with an explicit identity-verification check in the UI and API.

### Security notes before public deployment

This is a **De Montfort University–inspired development/academic demo, not an official university service**. If exposing it publicly, you should first replace/remove all seeded credentials (`SEED_DEMO=false` and delete seeded accounts), use HTTPS, configure domain-specific CORS, strengthen authentication against brute-force and session theft, enable upload antivirus scanning and audit logging, enforce data retention, add file type limits/quotas, set a real secrets-management solution, review dependency vulnerabilities, enforce identity verification outside the prototype UI, implement account recovery through verified email or university SSO, create backups, and complete privacy/compliance/security testing. The demo admin is seeded automatically when `SEED_DEMO=true`; disable it for deployment and provision a real admin through a controlled procedure.

If you set `SEED_DEMO=false` on a brand-new database, there is no built-in admin-creation UI. This is intentional to prevent untrusted users from promoting themselves. Create an admin only by an authorized database provisioning flow.

**Demo-only design choice:** JWT is stored in browser localStorage for easy local development. A hardened production deployment should consider secure HttpOnly cookies, CSRF protections, SSO, MFA and shorter-lived tokens with refresh-session management.

## Testing and troubleshooting

- To run source smoke tests: `node tests/smoke.mjs && node tests/chatbot.mjs && node tests/university-branding.mjs` at the project root.
- API health check: `http://localhost:4000/api/health` when running Node locally; with Docker use `http://localhost:8080/api/health`.
- Backend JavaScript syntax check: `cd server && npm run check`.
- Frontend production compilation: `cd client && npm run build`.
- View Docker logs: `docker compose logs -f api` and `docker compose logs -f db`.
- If port 8080 is occupied, change `"8080:80"` to `"8081:80"` under `web` in `docker-compose.yml`, then open `http://localhost:8081` and set `FRONTEND_ORIGIN=http://localhost:8081` for the API service (or keep the same-origin Nginx proxy).
- If a password reset seems ineffective, check that an admin approved the most recent request. Earlier pending requests for that student are removed when a new one is submitted.
- All document uploads live in `uploads` (Docker named volume) or `server/data/uploads` (local mode). Never serve these directly as public static files.

## Thesis-to-feature mapping

| Thesis requirement | Implementation |
| --- | --- |
| Student account registration, login | `/api/auth/register`, `/api/auth/login`, Login/Register UI |
| JWT, hashed passwords, role-based control | Express authentication middleware and protected routes |
| Profile management | `/api/profile`, My Profile page |
| Application submission and tracking | `/api/applications`, administrator reviews |
| Document upload and verification | `/api/documents`, private downloads, review statuses |
| Accommodation registration | `/api/accommodation`, housing approvals |
| Student dashboard/progress | `/api/dashboard`, dynamic milestone checklist |
| Administrator dashboard | `/api/admin/overview`, management pages |
| Admin-approved password recovery | `/api/auth/forgot`, `/api/admin/reset-requests` |
| Rule-based chatbot assistance | `/api/chat`, rule list in `server/src/chatbot.js` |
| Onboarding announcements | `/api/announcements`, admin publisher |

This source is a **new implementation based on the project contract specification**, not an extraction of the original project's source code. The UI is a polished reinterpretation of the dashboard structure and functionality shown in the thesis screenshots.
