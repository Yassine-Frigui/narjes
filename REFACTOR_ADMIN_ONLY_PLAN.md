# Refactor: Admin-only Execution Plan

This document describes a safe, step-by-step plan to refactor the project to keep only the admin-side UI and necessary backend functionality. It includes exact commands, file targets, QA steps, a rollback plan, and follow-ups.

> Assumptions

* You are working in the repository at `C:\Users\yassi\Desktop\narjes`.
* Frontend is located in `frontend/` and currently contains both `admin` and `client` pages.
* Backend is located in `backend/` and contains some client-facing routes and admin routes.
* We will perform a conservative, reversible refactor: client code will be archived (moved) rather than permanently deleted during the first pass.

## Goals (contract)

* Remove client-side pages and components from the active frontend code so only admin pages are built and served.
* Keep backend functionality required for admin UI. Do not remove backend code that admin UI uses.
* Preserve client code history by moving it to `frontend/archive/client` or a branch.
* Leave the repository in a buildable and runnable state (frontend build + backend start).

## High-level checklist

```markdown
* [ ] Create a feature branch `refactor/admin-only` and push it
* [ ] Archive client pages/components to `frontend/archive/client`
* [ ] Update routes and entry points to remove client routes
* [ ] Remove or disable client-specific contexts/providers (archive them)
* [ ] Verify admin UI builds and runs locally
* [ ] Audit backend routes and mark client-only routes as deprecated (don't delete yet)
* [ ] Update docs and deployment config
* [ ] Run lint/tests and manual QA
* [ ] Create PR and merge after review
```

## File-level targets (what to keep / archive / inspect)

* Frontend (keep)
  * `frontend/src/pages/admin/` -> keep
  * `frontend/src/components/*` -> keep admin and shared components (inspect for client prefix)
  * `frontend/src/layouts/AdminLayout.jsx` -> keep
  * `frontend/src/context/LanguageContext.jsx` -> keep if admin uses i18n, otherwise simplify

* Frontend (archive)
  * `frontend/src/pages/client/` -> move to `frontend/archive/client/pages/`
  * `frontend/src/components/Client*` (ClientNavbar, ClientFooter, ClientLayout, ClientProtectedRoute) -> move to `frontend/archive/client/components/`
  * `frontend/src/context/ClientAuthContext.jsx`, `ClientAuth` providers -> move to `frontend/archive/client/context/`

* Backend (inspect / conservative approach)
  * `backend/src/routes/public.js`, `publicServices.js`, `publicServicesMultilingual.js`, `clients.js` -> mark as client-facing; do not delete yet
  * `backend/src/routes/admin.js`, `memberships.js`, `reservations.js`, `services.js`, `expenses.js` -> keep (admin functionality)
  * `backend/src/middleware/auth.js` -> keep

## Detailed steps and commands (Windows cmd)

1) Create a feature branch and backup the current state

```cmd
cd /d C:\Users\yassi\Desktop\narjes
git checkout -b refactor/admin-only
git status
```

Optional: create a zip backup of the repository (useful before large moves).

2) Archive client frontend files (safe, reversible)

```cmd
cd /d C:\Users\yassi\Desktop\narjes
mkdir frontend\archive
mkdir frontend\archive\client

:: Move the client pages and components (git mv preferred for history)
git mv frontend\src\pages\client frontend\archive\client\pages || move frontend\src\pages\client frontend\archive\client\pages
git mv frontend\src\components\Client* frontend\archive\client\components || move frontend\src\components\Client* frontend\archive\client\components
git mv frontend\src\context\ClientAuthContext.jsx frontend\archive\client\context\ClientAuthContext.jsx || move frontend\src\context\ClientAuthContext.jsx frontend\archive\client\context\

:: If git mv fails for some files, use copy + git rm after verifying
```

3) Update routing and entry points (example edits)

* Edit `frontend/src/App.jsx` (or wherever routes live):
  * Remove imports for client pages and client routes
  * Keep admin `Route` declarations
  * Ensure the default route points to an admin page (e.g., `/admin` or `/` -> Admin dashboard)

* Edit `frontend/src/main.jsx` or `index.jsx`: remove client-only providers (ClientAuth) and keep Admin providers only.

4) Install and build the frontend to verify no missing imports

```cmd
cd /d C:\Users\yassi\Desktop\narjes\frontend
npm install
npm run build
```

If `npm run build` fails with missing modules or imports, open the error and:
* restore the missing component from `frontend/archive/client` if it was accidentally shared, or
* refactor the shared component into `frontend/src/components/shared` and update imports.

5) Start backend and run smoke tests

```cmd
cd /d C:\Users\yassi\Desktop\narjes\backend
npm install
npm run dev   :: or npm run start depending on the project
```

Open admin UI in the browser and confirm admin flows (login, CRUD for services/reservations/memberships, etc.).

6) Audit backend endpoints

* Run a quick search for endpoints used by admin UI and confirm they exist in the backend routes. Example (PowerShell or Git Bash):

```cmd
cd /d C:\Users\yassi\Desktop\narjes
:: Windows findstr example - search for API endpoints used in frontend
findstr /s /i "api/" frontend\src\pages\admin\* || findstr /s /i "fetch(\|axios\|api" frontend\src\pages\admin\*
```

* If you find admin UI calls an endpoint that is client-only, restore or adapt the backend route.

7) Lint, tests, and CI

* Run lint and unit tests (if present):

```cmd
:: From repo root or respective package folders
cd frontend
npm run lint
npm test

cd ..\backend
npm run lint
npm test
```

8) Documentation and deployment config

* Update `README.md`, `README-LOCAL-SETUP.md` to state: "Admin-only UI; client pages archived to `frontend/archive/client` or branch `archive/client`".
* Update `netlify.toml`, `vite.config.js`, or any hosting config that references client routes.

9) Commit and push the feature branch

```cmd
git add -A
git commit -m "refactor(admin): archive client UI and keep admin-only frontend"
git push -u origin refactor/admin-only
```

10) Create a PR and QA checklist for reviewers

* Provide screenshots and a quick script to verify main admin flows.
* Ask reviewers to check for broken imports, missing API endpoints, and non-admin routes.

## Rollback plan

* If anything goes wrong during the refactor and you want to revert changes, do one of the following:

1) Reset the working branch and delete it:

```cmd
git checkout master
git branch -D refactor/admin-only
```

2) Restore archived files from the archive directory:

```cmd
git mv frontend\archive\client\pages frontend\src\pages\client
git mv frontend\archive\client\components frontend\src\components
git mv frontend\archive\client\context\ClientAuthContext.jsx frontend\src\context\ClientAuthContext.jsx
git commit -m "revert: restore client UI from archive"
```

3) If you pushed changes and want to revert the remote branch, delete the branch on remote and recreate from master.

```cmd
git push origin --delete refactor/admin-only
git checkout master
git push origin master
```

## QA / Acceptance criteria

* Frontend build (`npm run build`) completes successfully.
* Admin UI loads and allows admin flows (login, CRUD) that were working before.
* No client pages are reachable in the deployed site or local dev server.
* Lint and tests (if any) pass or failing tests are documented and scheduled.

## Follow-ups (optional improvements)

* After stabilizing the admin-only branch, make a second pass to remove client-only dependencies from `frontend/package.json` and `node_modules`.
* Optionally create a separate branch `archive/client` that contains the client UI in the repository history but not in the active tree.
* Add a smoke/integration test that boots the backend and runs a headless browser to check the main admin flows.

## Timeline estimate (for a single developer)

* Branch + archive: 1–2 hours
* Routing/entry edits + local builds: 1–3 hours (depends on shared components)
* Backend audit + small fixes: 1–3 hours
* QA, docs, PR: 1–2 hours

---

If you want, I can now perform the first automated, low-risk step for you: create the branch `refactor/admin-only` and move (archive) the client files into `frontend/archive/client` while keeping everything committed on that branch. Tell me to proceed and I will run the moves and run a frontend build to report back.
