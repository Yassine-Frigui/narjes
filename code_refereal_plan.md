# Zenshe Referral System Implementation Plan

## 1. Overview
Implement a referral system that allows existing clients to refer new clients. When a referred client completes their first paid reservation, the referrer receives a reward (e.g., a free session or discount). The system must track referrals, enforce business rules, and provide admin visibility.

## 2. Database Changes
- **Client Model**: Add a `referrerId` field (nullable, foreign key to Client).
- **Referral Model** (optional, for audit):
  - `id`, `referrerId`, `referredId`, `createdAt`, `rewardIssued` (boolean), `rewardIssuedAt` (datetime)
- **Reservation Model**: No change unless tracking referral-triggered rewards per reservation.

## 3. Backend Implementation
### a. Referral Capture
- On client signup, allow entry of a referral code or referrer email/ID.
- Validate that the referrer exists and is eligible (not self-referral).
- Store `referrerId` in the new client's record.

### b. Referral Reward Logic
- On reservation completion (status = 'paid' or 'completed'), check if:
  - The client has a `referrerId`.
  - This is the client's first paid reservation.
  - The referrer has not already received a reward for this referral.
- If all conditions met:
  - Issue reward to referrer (e.g., create a reward record, send notification).
  - Mark reward as issued in Referral model or client record.

### c. Admin Tools
- Admin dashboard: List referrals, filter by status (pending, rewarded), search by client/referrer.
- Manual override: Admin can issue or revoke rewards.

### d. API Endpoints
- `POST /api/clients/signup` (accepts referral code)
- `GET /api/referrals` (admin only)
- `POST /api/referrals/reward` (admin/manual override)

## 4. Frontend Implementation
### a. Signup Form
- Add optional field for referral code or referrer email.
- Show confirmation if referral is accepted.

### b. Client Dashboard
- Show referral status ("You were referred by X", "You have referred Y clients").
- Show reward status ("You earned a free session!").

### c. Admin Dashboard
- List of all referrals, filter/search, reward status, manual actions.

## 5. Business Rules
- No self-referral (client cannot refer themselves).
- One reward per referred client (first paid reservation only).
- Referrer must be an active client.
- Rewards are not stackable (one per referral event).
- Optionally, limit number of rewards per referrer per month/year.

## 6. Notifications
- Email/Telegram notification to referrer when reward is earned.
- Optional: Notify admin of new referrals and rewards issued.

## 7. Edge Cases & Validation
- Prevent abuse (e.g., fake accounts, duplicate referrals).
- Handle deleted clients (cascade or nullify referrals).
- Ensure idempotency (reward not issued multiple times).

## 8. Testing
- Unit tests for referral logic (signup, reservation, reward issuance).
- Integration tests for API endpoints.
- Manual QA for admin dashboard and notifications.

## 9. Deployment & Migration
- Add migration script to update Client model and create Referral model.
- Deploy backend and frontend changes together.
- Announce feature to clients/admins.

---
**Next Steps:**
1. Update database schema (add fields/models).
2. Implement backend logic and endpoints.
3. Update frontend forms and dashboards.
4. Test end-to-end.
5. Deploy and monitor.
