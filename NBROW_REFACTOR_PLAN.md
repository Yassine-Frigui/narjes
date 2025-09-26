# NBrow Studio by Narjes — Refactor & DB Reduction Plan

Goal: convert the repository to an admin-only, French-only app branded "NBrow Studio by Narjes". Remove client-facing features, drop multilingual support (keep French only), remove marketing/costs/settings pages, and reduce the database by removing promotions, client reviews, influencer links/events and salon parameters. Update backend and frontend accordingly.

This file contains a safe, ordered execution plan, commands (Windows cmd / PowerShell friendly), DB migration examples, QA steps and rollback instructions.

IMPORTANT: create a branch and a full DB backup before performing destructive changes. Do not commit secrets.

## Quick checklist

```markdown
- [ ] Create feature branch and export DB backup
- [ ] Replace branding strings (waad / Beauty Nails -> NBrow Studio by Narjes / Narjes)
- [ ] Frontend: remove en/ar locales; keep fr only; remove costs/marketing/settings admin pages; enforce 5 French services
- [ ] Backend: remove routes, controllers, models for promotions, reviews, influencer tables, salon params; remove multilingual public endpoints
- [ ] Add DB migration script(s) to drop tables/columns and seed canonical 5 services
- [ ] Run builds, run backend, manual QA of admin flows
- [ ] Commit, push branch and open PR
```

## 1) Prep — branch + DB backup (mandatory)

Commands (Windows cmd):

```cmd
cd /d C:\Users\yassi\Desktop\narjes
git checkout -b feat/narjes-brand-fr-only
mkdir -p db_backups

:: create SQL dump (example: local MySQL)
mysqldump -u <user> -p -h <host> <db_name> > db_backups\pre_narjes_migration_2025-09-26.sql
```

If you use a hosted DB, export a snapshot via provider console or run equivalent mysqldump with SSL options.

## 2) Brand rename (safe search + replace)

Plan:
- Search for brand strings and review hits before replacing.
- Replace visible strings and docs first, then code identifiers if needed.

Search commands:

```cmd
git grep -n -i "waad\|beauty-nails\|Beauty Nails" > files-with-waad.txt
notepad files-with-waad.txt
```

Do replacements carefully (file-by-file) — do not change repository remote URLs or CI secrets unless intentional.

Example replacements to apply (case-sensitive review):
- "Beauty Nails - Chez Waad" -> "NBrow Studio by Narjes"
- "waad" / "Waad" -> "narjes" / "Narjes" (review occurrences)
- Update `SALON_NAME` in `backend/.env` to: SALON_NAME="NBrow Studio by Narjes"

Commit message suggestion:

```cmd
git add -A
git commit -m "chore: apply NBrow Studio by Narjes branding (French-only)"
```

## 3) Frontend changes (French-only admin)

Targets (edit or remove):

- Remove locale folders: `frontend/src/locales/en/` and `frontend/src/locales/ar/`
- Keep `frontend/src/locales/fr/translation.json` and ensure French keys exist for admin UI
- Edit `frontend/src/i18n.js` to default `fr` only and remove fallback code for en/ar
- Remove `frontend/src/components/LanguageSwitcher.jsx` and any UI that lets user choose language
- Remove admin pages/routes for costs & settings:
  - `frontend/src/pages/admin/AdminCosts.jsx` (delete) or remove route in `App.jsx`
  - `frontend/src/pages/admin/AdminSettings.jsx` (delete) or remove route
- Ensure `frontend/src/App.jsx` no longer references `costs` or `settings` routes
- Update services UI:
  - `frontend/src/pages/admin/AdminServices.jsx` — make services display/use French names only
  - `frontend/src/components/forms/ServiceForm.jsx` — change service category input to a dropdown containing only the five French services

Commands (use git rm to remove tracked files):

```cmd
cd /d C:\Users\yassi\Desktop\narjes
git rm -r frontend\src\locales\en frontend\src\locales\ar || del /s frontend\src\locales\en
git rm frontend\src\components\LanguageSwitcher.jsx || del frontend\src\components\LanguageSwitcher.jsx
git rm frontend\src\pages\admin\AdminCosts.jsx frontend\src\pages\admin\AdminSettings.jsx
```

Make small commits per logical change.

## 4) Backend changes (drop DB-backed features + routes)

Targets (examples - adapt to actual file names in repo):

- Routes to remove or update in `backend/src/routes/`:
  - `public.js`, `publicServices.js`, `publicServicesMultilingual.js` (remove)
  - `clients.js`, `clientAuth*.js` (already removed earlier if not used)
  - any `promotions`, `reviews`, `influencer` routes (remove)
  - `settings`/`parametres` routes (remove)
- Models to remove in `backend/src/models/`:
  - `Promotion.js`, `Review.js` (avis), `InfluencerLink.js`, `InfluencerEvent.js`, `SalonParameter.js` (names may vary)
- Remove or update any services under `backend/src/services/` that reference removed tables
- Edit `backend/src/app.js` to stop registering deleted routes (remove app.use lines)

Commit backend deletions in small steps.

## 5) DB migration: example SQL (review and adapt to actual schema)

Create file `backend/database/migrations/2025-09-26_drop_client_features.sql` with content like:

```sql
-- Drop client-facing and marketing tables (backup first)
START TRANSACTION;

-- Drop influencer tables
DROP TABLE IF EXISTS influencer_events;
DROP TABLE IF EXISTS influencer_links;

-- Drop promotions and reviews
DROP TABLE IF EXISTS promotions;
DROP TABLE IF EXISTS reviews;

-- Drop salon parameters
DROP TABLE IF EXISTS salon_parameters;

-- Optional: remove multilingual columns from services (keep name_fr)
ALTER TABLE services
  DROP COLUMN IF EXISTS name_en,
  DROP COLUMN IF EXISTS name_ar;

COMMIT;
```

Run on staging first, verify, then run on production.

Seeding canonical French services (example):

```sql
DELETE FROM services;
INSERT INTO services (name_fr, slug, price, duration_minutes) VALUES
  ('Microblading', 'microblading', 0.00, 60),
  ('Microshading', 'microshading', 0.00, 60),
  ('Sourcils', 'sourcils', 0.00, 45),
  ('Beauté', 'beaute', 0.00, 30),
  ('Semi-permanent', 'semi-permanent', 0.00, 45);
```

Adjust `price` and `duration_minutes` to your defaults.

## 6) Update backend code to reflect DB changes

- Remove model imports and any queries referencing dropped tables/columns
- Update service endpoints to use `name_fr` or `label` only
- Remove multilingual endpoints such as `publicServicesMultilingual`

Files to inspect:

- `backend/src/models/`
- `backend/src/routes/` (admin, services, reservations, memberships, expenses, revenue)
- `backend/src/services/`
- `backend/src/app.js` (route registrations)

## 7) Update environment and docs

- Update `backend/.env` values (do not commit secrets):
  - `SALON_NAME="NBrow Studio by Narjes"`
  - `FRONTEND_URL` and other branding emails if needed
- Update `frontend/index.html` <title>, meta tags, and any hard-coded references
- Update README and other docs to reflect the new brand and French-only scope

## 8) Build & QA

Run the following locally:

```cmd
:: build frontend
cd frontend
npm install
npm run build

:: start backend
cd ..\backend
npm install
npm run dev
```

Manual QA checklist

- [ ] Admin login works
- [ ] Admin Services page lists only the five French services
- [ ] Create/Edit/Delete service operations succeed and persist in DB
- [ ] Reservations creation and admin reservation management work
- [ ] Inventory pages work
- [ ] Costs & marketing and Settings pages are not accessible

## 9) Commit strategy & PR

- Make small commits with focused messages (branding, frontend i18n, backend removal, migration, seeding)
- Push branch and open PR for review

## 10) Rollback plan

1. Revert code changes via git if needed:

```cmd
git checkout master
git revert <merge-commit-hash>
```

2. Restore DB from backup:

```cmd
mysql -u <user> -p -h <host> <db_name> < db_backups\pre_narjes_migration_2025-09-26.sql
```

3. Redeploy previous version if required.

## Acceptance criteria

- App branding updated to "NBrow Studio by Narjes" everywhere user-facing (admin UI, emails, README)
- Admin UI is French-only (no language switcher; `fr` locale active)
- Services table contains only the five canonical French services
- DB no longer contains promotions, reviews, influencer tables or salon param entries
- No costs/marketing/settings pages available in admin UI
- Frontend builds and backend starts; main admin flows pass manual QA

## Timeline estimate

- Branch & DB backup: 30–60 minutes
- Branding and frontend i18n changes: 1–2 hours
- Backend cleanup and DB migration: 1–3 hours (depend on FK complexity)
- QA and fixes: 1–2 hours

---

If you want, I can start with one of these automated steps now:

- A) Run a repo-wide search and generate a preview list of files to change for branding (safe)
- B) Apply branding replacements file-by-file and commit (destructive)
- C) Implement frontend reductions (remove locales, costs/settings pages, enforce services list)
- D) Generate a tailored DB migration SQL after scanning `backend/src/models` (I will inspect model file names and produce precise SQL)

Reply with A/B/C/D to tell me which to start with.
