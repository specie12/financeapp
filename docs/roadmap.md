# Master Plan: Sequenced Roadmap to a Successful App

**Date:** July 6, 2026
**Companion to:** `positioning.md`, `decision-catalog.md`, `path-to-first-user.md`, `ux-backlog.md`
**Voice:** Founder-honest. The living plan — update it as validation teaches you things.

> **North star (`positioning.md`):** a financial-**decisions** engine — every major
> money fork, modeled honestly against real data, in one place. Real estate is the
> go-to-market wedge; trust (the disclosure layer) is the moat.

**Chosen posture:** _polish + validate the wedge first_, solo-focused. So the near
sequence is **Stabilize → Validate → Deploy → Harden → Deepen** — not more features
yet. Slice everything into small, shippable chunks.

---

## Where we are (honest)

- A credible, **differentiated MVP of the wedge** exists and is tested
  (finance-engine 503, api 122, web 33). Rent-vs-buy, mortgage-vs-invest, the
  rental decision flow, Monte Carlo, scenarios, net worth all work.
- **One watched session done:** rent-vs-buy landed well; **Scenarios "Update" was
  silently broken** (fixed) — a frontend/backend contract drift (string vs typed
  value) that unit tests missed.
- **Local-only.** Not deployed, sandbox Plaid, seeded demo account still present.
- The strategy is fully mapped in the companion docs; this ties it into an order.

**The signal from the test:** the flows aren't yet trustworthy enough to put in
front of strangers — and the scenario bug is almost certainly **a class, not a
one-off.**

---

## Phase 0 — Stabilize the wedge (do now)

Goal: no silent, trust-breaking bugs in the core flows. This is the direct lesson
of the test.

- [ ] **Form contract audit (the bug class).** The scenario bug was a form sending
      the wrong _type_ vs the Zod schema. Audit every create/update form against
      its schema: **assets, liabilities, cash-flow, goals, rental (add + decision),
      tax profile, budget, transactions, scenarios.** Look for string-vs-number,
      dollars-vs-cents, and missing coercion. Fix + add a coercion/regression test
      per form.
- [ ] **Surface API errors in the UI.** The scenario 400 showed nothing to the
      user. Every form submit should show the error, not fail silently. (Highest
      trust win for the least code.)
- [ ] **Fold in the rest of the test findings** (pending — see the running list at
      the bottom).
- [ ] **Grow web-test coverage** on the wedge flows (harness exists; coverage is
      thin). Lock each form's submit → API contract.

**Done when:** you can click through every create/update form for the wedge and
each either succeeds or shows a clear error — no silent no-ops.

---

## Phase 1 — Validate deeper (overlaps Phase 0)

Goal: learn whether the wedge actually helps people decide, across both personas.

- [ ] 2–3 more **watched sessions** (`path-to-first-user.md` script): a homebuyer
      (rent-vs-buy) _and_ a property investor (rental decision). Pre-commit the
      pass bar; observe, don't demo.
- [ ] After each, feed fixes back into Phase 0 and note the one thing people love /
      get stuck on.
- [ ] Use the sessions to settle the **personal-vs-investment nav question**
      (`ux-backlog.md`) with behavior, not a guess.

**Done when:** ≥2 testers reach a decision they trust without you intervening, and
you can name the single sharpest "aha" and the single biggest drop-off.

---

## Phase 2 — Get deployable (after the wedge is trustworthy)

Goal: move validation from "over your shoulder" to "here's a link."

- [ ] Gate-1 deploy (`path-to-first-user.md`): managed Postgres (Neon/Railway) →
      API (Railway/Render/Fly) → web (Vercel). Real JWT secrets, `CORS_ORIGIN`
      locked, `NEXT_PUBLIC_API_URL` wired, `prisma migrate deploy`.
- [ ] **Kill the seeded demo account** + the dev password.
- [ ] Smoke the full fresh-signup → onboarding → decision flow on the deployed URLs
      (already validated locally this session).

**Done when:** a stranger can sign up at a URL and reach the decision flow with
sample data.

---

## Phase 3 — Security hardening (before real bank data / open signups)

Grounded in the repo audit (`path-to-first-user.md`). Already in place: Plaid token
encryption, household isolation guard, bcrypt. Gaps to close:

- [ ] **Auth rate limiting** (`@nestjs/throttler`) + lockout — brute-force is open
      today.
- [ ] **Security headers** (`helmet`).
- [ ] **Refresh-token rotation + revoke on logout / reuse detection.**
- [ ] **Explicit IDOR test** — user A must 403/404 on user B's ids.
- [ ] No stack traces to clients in prod; dependency/secret scanning in CI.
- [ ] **Privacy policy + terms**, and a working **data export + delete** path.
- [ ] Plaid production access — only after all the above.

**Done when:** you'd be comfortable letting a stranger connect a real account.

---

## Phase 4 — Deepen the moat (features, once validated + deployable)

Order from `decision-catalog.md`, adjusted by what validation taught you.

1. [ ] **Tax as a layer — first slice:** a shared `TaxProfile` the finance-engine
       reads, then **after-tax modeling in the rental decision flow starting with
       depreciation** (the tax shield that often flips a rental deal).
2. [ ] **Insurance adequacy** ("Am I underinsured?") — high-stakes, unclaimed.
3. [ ] **Fee & drag analyzer** — concrete, switch-inducing, low effort.
4. [ ] **Personal-vs-investment nav regroup** (`ux-backlog.md`) + rename Rental
       Properties → My Rentals.
5. [ ] Then Tier 2/3 (refinance engine, retirement + Social Security, equity comp,
       concentration/liquidity, car buy-vs-lease) as demand directs.

**Guiding rule:** every new decision tool ships with its disclosure payload and a
contract test — the moat and the bug-class prevention, built in.

---

## Cross-cutting / housekeeping (ongoing)

- [ ] **Open the PRs** and merge to `main`: `feat/rental-wedge-engine` (M1–P4 +
      fixes) and `docs/…` (strategy docs). Set your real git author identity first.
- [ ] Keep **test coverage** growing with each flow (harness in place).
- [ ] Treat the docs as living: `decision-catalog.md` = feature backlog,
      `path-to-first-user.md` = ops gate, `positioning.md` = north star, this file
      = the order.

---

## Immediate next action

**Start the Phase 0 form-contract audit** — it's the direct, systemic fix for the
class of bug the test exposed, and it's exactly the "polish the wedge so it's
trustworthy" work you chose to front-load. Everything else waits behind trustworthy
core flows + a few more watched sessions.

---

## Running list: test findings (update as they come)

- ✅ Rent-vs-buy: landed well, no comments.
- ✅→fixed: Scenarios "Update" silently failed (string-vs-typed override values).
- _(add further observations here)_
