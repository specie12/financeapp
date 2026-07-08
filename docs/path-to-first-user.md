# Path to First Real User: Deploy, Security, and a Validation Script

**Date:** July 5, 2026
**Companion to:** `positioning.md`, `decision-catalog.md`
**Voice:** Founder-honest. A checklist, not a pitch.

> The app runs locally against a local Postgres. The goal now is not more
> features — it's to learn whether the wedge actually helps a real person decide.
> This doc is the shortest honest path there.

---

## The key move: two gates, not one

The most expensive mistake here is treating "first user" as "production launch"
and building a bank-grade platform before anyone has confirmed the value. Split
it:

- **Gate 1 — Watched validation (days).** One trusted person who has a _real_
  money decision, on a basic deploy, with fake / sandbox / their-own-manually-
  entered data. You are in the room. Minimal security bar. Goal: does the
  decision flow help them decide?
- **Gate 2 — Real strangers, real bank data (weeks).** Only after Gate 1 says the
  value is real. This is where the full finance-app security + legal bar applies.

Do **not** pay the Gate 2 cost to clear Gate 1.

---

## Gate 1 — Watched validation

### Minimal deploy (half a day)

This stack: pnpm/Turbo monorepo — NestJS API, Next.js web, Postgres/Prisma.

1. **Managed Postgres** — Neon or Railway (free tier fine). Grab the
   `DATABASE_URL`.
2. **API (NestJS)** — Railway / Render / Fly.io (long-running Node). Set env:
   real `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` (32+ random chars — NOT the
   `.env.example` values), `DATABASE_URL`, `CORS_ORIGIN` = the web URL. Build:
   `pnpm api build`; start: `node dist/main`. Run `prisma migrate deploy` on
   release.
3. **Web (Next.js)** — Vercel (natural fit). Set `NEXT_PUBLIC_API_URL` = the API
   URL. Deploy.
4. Smoke test: sign up → onboarding → the rental decision flow end-to-end on the
   deployed URLs.

### Minimal safety bar (a few hours)

Even for a trusted tester, do these — they're cheap and one is a real hole:

- [ ] **Delete/disable the seeded demo account** (`demo@example.com`) and the
      known password set during local testing. No default creds in a deployed env.
- [ ] **Real JWT secrets** (generated, not committed, not the example values).
- [ ] **HTTPS** — automatic on Vercel/Railway/Render. Confirm no mixed content.
- [ ] **Lock `CORS_ORIGIN`** to the exact web domain (already configurable in
      `main.ts`; default is localhost).
- [ ] **Use fake or Plaid-sandbox data.** Have the tester enter figures manually
      or use sandbox — do NOT connect a real bank yet. This sidesteps the entire
      Gate 2 compliance burden for validation.

That's it. Don't gold-plate. You're testing value, not running a bank.

### The validation script (the part everyone skips)

**Recruit (1–3 people):** someone facing a _live_ decision the wedge covers —
actively weighing a rental purchase, a rent-vs-buy, or a payoff-vs-invest call.
One person with a real, current decision beats ten hypotheticals.

**Run it as observation, not a demo:**

1. Give a task, then go quiet: _"You're deciding whether to buy [their actual
   property / a place they're considering]. Use this to figure it out. Think out
   loud."_
2. **Do not guide, demo, or explain.** Every time you want to jump in, that's a
   finding — write down where they got stuck.
3. Watch specifically: Can they get through onboarding to a tool? Do they reach a
   decision? Do they _trust_ the verdict? Do they read/understand the disclosure,
   or ignore it? Where do they hesitate or backtrack?

**Ask afterward (past/behavior, not hypothetical — the Mom Test):**

- "What did you expect to happen there?" (at each stumble)
- "How do you make this decision today?" (spreadsheet? advisor? gut?)
- "What would you have to see to trust this number?"
- "Walk me through the last time you made a money decision like this."
- Only near the end, carefully: "What would make you use this for the _next_
  decision instead of your current way?"

**Avoid:** "Do you like it?" / "Would you use it?" / "Would you pay?" as opening
questions — they generate polite lies. Watch behavior; infer demand.

**Decide the pass bar _before_ the session.** Suggested: _"2 of 3 reach a
confident decision they trust, without me intervening, and describe a real next
decision they'd bring back."_ Write it down now so you can't rationalize later.

**Anti-patterns:** demoing instead of watching; building from one loud opinion;
treating politeness as validation; adding a Tier-1 feature because a single
tester wished for it.

---

## Gate 2 — Real users with real bank data (the full bar)

Only after Gate 1 passes. This is where finance-app rigor is non-negotiable.

### Deploy hardening

- [ ] Separate staging vs production DBs and secrets.
- [ ] Automated DB backups + a tested restore (managed providers offer this).
- [ ] `prisma migrate deploy` in CI on release; never `migrate dev` in prod.
- [ ] Health checks + error monitoring (Sentry) + uptime alerts.
- [ ] Structured logging with **no secrets/PII in logs**.

### Security checklist (grounded in this repo)

Already in place — verify, don't rebuild:

- [x] **Plaid access tokens encrypted at rest** (`EncryptionService`, used in
      `plaid.service.ts`). Confirm the encryption key is a real prod secret.
- [x] **Household data isolation** (`HouseholdGuard` + `resource-ownership.service`,
      with tests). This is the #1 multi-tenant risk — add an explicit IDOR test:
      user A must get 403/404 on user B's asset/liability/rental/scenario ids.
- [x] **Configurable CORS**, **bcrypt password hashing (12 rounds)**, short access-
      token expiry, refresh-token table.

Gaps to close before real data:

- [ ] **Rate limiting** on auth endpoints (login/refresh/signup) — no throttler
      today; brute-force is wide open. Add `@nestjs/throttler` + account lockout.
- [ ] **Security headers** — no `helmet` today. Add it (HSTS, no-sniff, frame
      options, a CSP).
- [ ] **Refresh-token rotation + revocation on logout / reuse detection.**
- [ ] **Verify Zod validation on every mutating endpoint** (boundaries are mostly
      covered; confirm no gaps).
- [ ] **No stack traces / internal errors leaked** to clients in prod.
- [ ] **Dependency + secret scanning** in CI (e.g., `pnpm audit`, gitleaks).
- [ ] **Plaid production access** — only after the above; keep tokens server-side,
      never to the client.

### Legal / compliance (yes, even small)

- [ ] Privacy policy + terms of service (you're collecting financial data).
- [ ] A working **data-export and data-deletion** path (table stakes, and likely
      required).
- [ ] Decide what data you actually need to store vs. compute on the fly — the
      less financial PII at rest, the smaller your risk surface.

---

## Bottom line

The next unit of work is a **watched session with one real person**, not a Tier-1
feature and not a security project. Gate 1 is a half-day deploy + a few hours of
hardening + a disciplined hour of watching someone decide. Everything in
`decision-catalog.md` waits behind what that session teaches you.
