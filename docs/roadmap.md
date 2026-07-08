# Master Plan: End-to-End to a Sellable Product

**Updated:** July 7, 2026
**Status:** the single source of truth. The other docs are references (see the
Doc Map at the bottom). Voice: founder-honest.

> **North star:** a financial-**decisions** engine — every major money fork,
> modeled honestly against real data, in one place. Real estate is the go-to-
> market wedge; **trust** (the disclosure layer) is the moat. Full rationale in
> `positioning.md`.

**How to read this:** five sequenced phases from where we are now to a product
people pay for. Each **milestone** has a Goal and a **Done-when**. Do them in
order — the whole point is orderly implementation. Solo-focused, so slice each
milestone into small shippable chunks.

**Assumption to confirm (monetization):** the plan assumes a **SaaS subscription
(Free / Pro / Premium)** — consistent with `competitive-analysis-empower.md` and
the existing plan-limits infra. If the model should be different (one-time,
advisor marketplace, etc.), Phase 3 changes. Everything before Phase 3 is
model-agnostic.

---

## ▶ You are here

Phase 0 (stabilize) is **done**. We're early in **Phase 1 (validate)** — one
watched session done, wedge flows now trustworthy. Everything below is the road
from here.

---

## Phase 0 — Stabilize the wedge ✅ (done)

Goal: no silent, trust-breaking bugs in the core flows.

- ✅ Wedge built & tested (rentals→engine, Monte Carlo, decision flow, scenarios).
- ✅ Form-contract audit — scenario editor was the only offender.
- ✅ Error-surfacing sweep — no mutation fails silently.
- ✅ Trust/disclosure layer across the decision surfaces.

---

## Phase 1 — Validate the wedge 🔶 (in progress)

Goal: prove the wedge actually helps real people decide, before building more.

- **M1.1 — Watched sessions.** 3–5 sessions (homebuyer + property investor),
  using the `path-to-first-user.md` script; observe, don't demo. **Done-when:**
  ≥2 testers reach a decision they trust unaided, and you can name the single
  "aha" and the single biggest drop-off.
- **M1.2 — Fold findings into fixes.** Fast-loop the rough edges each session
  surfaces (like the scenario bug). **Done-when:** the running-findings list
  below is triaged and the blockers are fixed.
- **M1.3 — Settle key UX from behavior.** e.g., the personal-vs-investment nav
  grouping (`ux-backlog.md`) — decide by what testers do, not by guessing.
  **Done-when:** the nav/IA decisions are made and logged.

**Gate:** don't start Phase 2 until the wedge earns "yes, I'd use this for my
next decision" from real people. If it doesn't, iterate the wedge here.

---

## Phase 2 — Make it real: deploy + secure ⬜

Goal: a stranger can sign up at a URL and use it safely with real data.

- **M2.1 — Deploy (Gate 1).** Managed Postgres (Neon/Railway) → API
  (Railway/Render/Fly) → web (Vercel); real secrets, CORS locked, migrations on
  release; kill the seeded demo account. **Done-when:** fresh signup → onboarding
  → decision flow works on live URLs.
- **M2.2 — Security hardening (Gate 2).** Auth rate limiting + lockout, `helmet`,
  refresh-token rotation, an explicit IDOR test, no stack traces in prod, dep/
  secret scanning. **Done-when:** you'd let a stranger connect a real bank.
- **M2.3 — Legal + data rights.** Privacy policy, terms, working data
  export + delete. **Done-when:** the basics a finance app must have are live.
- **M2.4 — Real market data (optional here).** Flip the provider to live
  (`FINNHUB_API_KEY`) so the demo-data banner comes off. **Done-when:** investments
  show live quotes.

Details + the grounded security checklist: `path-to-first-user.md`.

---

## Phase 3 — Make it sellable: monetization + depth + polish ⬜

Goal: something people will pay for, with a working way to pay.

- **M3.1 — Billing + plan gating.** Stripe (or similar), wire the Free/Pro/
  Premium tiers to the existing plan-limits, upgrade/downgrade flow, paywall on
  gated features. **Done-when:** a user can subscribe and hit tier limits.
- **M3.2 — Depth that justifies paying: tax as a layer.** Ship the first slice
  from `decision-catalog.md` — a shared `TaxProfile` the engine reads, then
  **after-tax modeling in the rental decision flow starting with depreciation.**
  After-tax is what makes the decision tools _correct_ and worth money.
  **Done-when:** the rental verdict reflects the tax shield; other tools read the
  same profile.
- **M3.3 — One or two more Tier-1 "wow"s.** Insurance adequacy and/or the fee &
  drag analyzer — high-value, unclaimed, switch-inducing. **Done-when:** each
  ships with its disclosure + a contract test.
- **M3.4 — Product polish.** Onboarding, empty states, mobile responsiveness,
  the nav regroup, and **proactive nudges** (the "advisor" feel — "rates dropped,
  refinancing now breaks even in 14 months"). **Done-when:** the app feels like a
  product, not a prototype.

---

## Phase 4 — Launch ⬜

Goal: real users signing up, and some paying.

- **M4.1 — Landing page + pitch.** The "decision engine" positioning, wedge-first
  hero, honest-about-uncertainty angle. **Done-when:** a stranger understands the
  value in 10 seconds.
- **M4.2 — Analytics + funnel.** Instrument signup → onboarding → first decision
  → upgrade, plus error monitoring (Sentry). **Done-when:** you can see where
  users drop.
- **M4.3 — Beta → paid.** Small cohort first (Empower refugees, FIRE/Bogleheads,
  r/personalfinance), then open paid signups. **Done-when:** the first paying
  customers exist.
- **M4.4 — Support loop.** In-app feedback, a way to answer users. **Done-when:**
  you can hear and act on real usage.

---

## Phase 5 — Grow (demand-driven) ⬜

Goal: retention and growth; deepen the moat where users pull.

- Work the `decision-catalog.md` Tier 2/3 by demand: refinance/debt engine,
  retirement + Social Security claiming, equity comp (RSU/ISO/ESPP),
  concentration/liquidity health, car buy-vs-lease, dividend calendar,
  benchmarking.
- **Cross-decision integration** — the unique feature no one has ("you're weighing
  this rental, but your car lease ends and you could refi").
- Distribution/content marketing against the Empower pain points.

---

## Cross-cutting foundations (ongoing, every phase)

- **Tests grow with each flow** — every new tool ships with a contract/regression
  test (the harness exists; web coverage is still thin).
- **Repo hygiene** — merge `feat/rental-wedge-engine` and `docs/…` to `main`, open
  PRs, keep CI green, set a real git author identity.
- **Docs stay living** — this file is the plan; update the "you are here" and the
  findings list as you go.

---

## Doc Map (what each reference is for)

| Doc                               | Role                                                                      |
| --------------------------------- | ------------------------------------------------------------------------- |
| `roadmap.md` (this)               | **The plan** — phases, milestones, order                                  |
| `positioning.md`                  | **The why** — north star, wedge, decision-engine framing                  |
| `decision-catalog.md`             | **The feature backlog** — prioritized decision tools + tax hub/layer plan |
| `path-to-first-user.md`           | **The ops gate** — deploy steps + security checklist + validation script  |
| `ux-backlog.md`                   | **UX debt** — deferred IA (personal-vs-investment nav)                    |
| `competitive-analysis-empower.md` | **The market** — feature comparison vs Empower                            |

---

## Running list: validation findings (update as sessions happen)

- ✅ Rent-vs-buy: landed well, no comments.
- ✅→fixed: Scenarios "Update" silently failed (string-vs-typed override values) —
  root cause fixed, whole form-audit done, save errors now surface.
- _(add further observations here)_
