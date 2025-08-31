This folder contains a non-invasive SQL migration that adds two tables for influencer tracking.
```markdown
This folder contains a non-invasive SQL migration that adds two tables for influencer tracking.

Files:
- 2025-08-31_add_influencer_tables.sql  -- creates `influencer_links` and `influencer_events`.

Purpose and constraints:
- These tables are additive only. They do not alter or drop any existing tables.
- The design avoids strict foreign key constraints to remain compatible with your current workflow and schema.

How to apply:
1. From your project root, run the SQL file against your MySQL database. Example (Windows cmd.exe):

   mysql -u YOUR_DB_USER -p YOUR_DB_NAME < backend\\database\\migrations\\2025-08-31_add_influencer_tables.sql

2. Alternatively, open the file in a SQL client (MySQL Workbench, phpMyAdmin) and execute the statements.

How to use (overview):
- `influencer_links` stores generated codes for influencers. Each row represents a sharable code.
- `influencer_events` is an append-only events table: record each click and conversion with optional metadata.

Recommended backend integration (short):
- Expose a public redirect route, e.g. GET /r/:code, which:
  - looks up `influencer_links` by `code` and returns 404 if not found or inactive;
  - inserts an event row into `influencer_events` with event_type='click' and captures IP, UA, referrer;
  - sets a short-lived cookie like `influencer_code` to the code to persist the referral for conversions;
  - redirects the user to your normal landing page or targeted deep link.
- When creating a reservation or conversion, check for the `influencer_code` cookie and, if present,
  - resolve it to `influencer_links.id` and create an `influencer_events` row with event_type='conversion' and set `reservation_id`.

Notes:
- If you prefer stricter referential integrity later, you can add foreign keys referencing your `reservations` or `clients` tables.
- If you want, I can implement the backend endpoints and a small admin UI to create codes and view aggregated stats.

```

## Implementation plan — what to add (safe, additive, step-by-step)

Below is a concise, non-invasive plan you can follow to implement influencer tracking. It does not modify or drop any existing tables and integrates with your current workflow.

- [x] Migration file: `2025-08-31_add_influencer_tables.sql` (already present)
- [ ] Backend: public redirect route and tracking helpers
- [ ] Backend: admin routes to create/manage codes and to return aggregated stats
- [ ] Backend: hook into reservation/conversion flow to record conversions
- [ ] Frontend: public redirect usage and cookie capture (no schema changes)
- [ ] Frontend: small admin UI to create codes and view stats (optional)
- [ ] Tests & QA: unit tests for routes and manual smoke tests

### 1) Database (already included)
- The included SQL creates two additive tables only:
  - `influencer_links` — stores codes and meta for each influencer/link.
  - `influencer_events` — append-only event log for clicks and conversions.

These tables are intentionally loose on foreign keys to avoid impacting your existing schema.

### 2) Backend tasks (concrete changes)
Make a new file `backend/src/routes/influencer.js` (or add to `public.js`) exposing the following endpoints and helpers.

- Public redirect route
  - GET /r/:code
  - Behavior:
    1. Lookup `influencer_links` by `code` and ensure `active = 1`.
    2. Insert an `influencer_events` row with `event_type = 'click'` capturing: code_id, code, ip, user_agent, referrer, created_at.
    3. Set a cookie `influencer_code=<code>` with expiry (e.g. 30 days). Cookie attributes: `Path=/; SameSite=Lax; HttpOnly=false; Secure` only in production.
    4. Redirect (302) to your standard landing URL or a deep-link configured per `influencer_links.target_url`.

- Admin management endpoints (protected)
  - POST /api/admin/influencer    — create a new code (body: { name, code?, target_url?, metadata? })
  - GET  /api/admin/influencer    — list codes with pagination
  - GET  /api/admin/influencer/:id/stats — return aggregated stats (clicks, conversions, conversion_rate, last_30_days counts)
  - Optional: PUT /api/admin/influencer/:id — update active/target_url/metadata

- Reservation/conversion hook
  - In the reservation creation flow (where you insert into `reservations`), add these non-invasive steps:
    1. If request contains cookie `influencer_code`, resolve it to `influencer_links.id`.
    2. Insert an `influencer_events` row with `event_type = 'conversion'`, include `reservation_id`, `client_id` (if available), and metadata.
    3. (Optional) store the `influencer_link_id` in the `reservations` table only if you want permanent linkage — otherwise skip to avoid schema changes.

Implementation notes (backend):
- Use parameterized queries (mysql2 prepared statements) to avoid injection.
- Keep inserts to `influencer_events` lightweight and asynchronous (no blocking on third-party calls).
- Respect GDPR: if you collect IP/UA, make retention and purge policies clear in admin docs.

### 3) Frontend tasks (concrete changes)

- Public usage (nothing to add to DB):
  - Influencers share links like `https://your-site.example.com/r/ABC123`.
  - The redirect route handles click recording and sets a cookie; no frontend changes required for basic tracking.

- Optional Admin UI (recommended):
  - Small React page under `frontend/src/pages/admin/` (e.g. `AdminInfluencers.jsx`) that:
    - Lists influencer codes and basic stats (clicks, conversions, conversion rate).
    - Provides a form to create a new code (POST to `/api/admin/influencer`).
    - Shows a shareable link and a QR code button (QR optional).
  - Use existing `api.js` service to call admin endpoints and reuse auth context to protect the page.

### 4) API contracts (examples)

- Create code (admin)
  - Request: POST /api/admin/influencer
    - Body: { name: string, code?: string, target_url?: string, active?: boolean, metadata?: object }
  - Response: 201 { id, code, name, target_url, active }

- Public redirect
  - GET /r/:code
  - Response: 302 redirect to target URL or 404

- Record conversion (automatic in backend during reservation)
  - No public API required: backend reads `influencer_code` cookie and inserts event.

### 5) Testing and QA

- Local database apply (Windows cmd):

```bat
mysql -u YOUR_DB_USER -p YOUR_DB_NAME < backend\\database\\migrations\\2025-08-31_add_influencer_tables.sql
```

- Start backend locally and test
  1. Start backend (from repo root or backend folder depending on your workflow).
  2. Visit `http://localhost:5000/r/TESTCODE` in a browser — verify you get redirected and the cookie `influencer_code` is set.
  3. Create a reservation via frontend or API while cookie present — verify an `influencer_events` row with `event_type='conversion'` and `reservation_id` was created.

- Unit tests
  - Add tests for:
    - GET /r/:code inserts click event and sets cookie
    - Reservation creation with cookie inserts conversion event
    - Admin endpoints require admin auth and return expected payloads

### 6) Security & privacy

- Do not enable any admin endpoints without existing admin auth middleware.
- Set cookie `Secure` flag only in HTTPS/production; set `SameSite=Lax` to allow social redirects.
- Store minimal PII in `influencer_events` and follow any data-retention policy you maintain.

### 7) Minimal example SQL usage (lookup + insert)

- Lookup link (pseudo-SQL):
  SELECT id, code, target_url FROM influencer_links WHERE code = ? AND active = 1 LIMIT 1;

- Insert click event (pseudo-SQL):
  INSERT INTO influencer_events (influencer_link_id, code, event_type, ip, user_agent, referrer, metadata, created_at)
  VALUES (?, ?, 'click', ?, ?, ?, ?, NOW());

### 8) Deployment notes

- Run the migration on each environment (staging/production) using your existing DB deployment process.
- The backend routes are additive and can be deployed behind feature flags if desired.

---

If you want, I can next implement the backend route file (`backend/src/routes/influencer.js`) and a minimal admin React page and wire them together; tell me whether to implement backend only, or backend + frontend UI and I'll create the code and tests.
