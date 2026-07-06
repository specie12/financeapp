# UX / IA Backlog

**Companion to:** `positioning.md`, `decision-catalog.md`
Deferred UX and information-architecture improvements — captured so they aren't
forgotten, **not** to be built before the first-user validation (`path-to-first-user.md`).

---

## 1. Regroup the decision tools: personal vs. investment (deferred)

**Observation.** Rent-vs-buy and mortgage-vs-invest are _personal / lifestyle_
decisions ("how should I live/spend?"); buy-a-rental and rental analysis are
_investment_ decisions ("is this a good return?"). Today they're all lumped in
one "Planning" nav group, which blurs the two headspaces. There's also a naming
muddle: **Rent vs Buy** (personal), **Rental Properties** (tracking what you
own), and **Buy a Rental?** (deciding to invest) read as three similar things.

**Decision made:** express the split as **grouping/labels within one Decisions
area — NOT a hard top-level Personal/Business split.** Reasons: the boundary is
fuzzy (mortgage-vs-invest is both), a hard wall fragments the "one place for any
money decision" identity and the future cross-decision value, and "Business"
over-promises for someone with one rental.

**Proposed nav (replaces the single "Planning" group):**

```
Current                              Proposed
-------                              --------
Overview                             Overview
  Dashboard                            Dashboard
  Net Worth                            Net Worth
Money                                Money
  Budget                               Budget
  Transactions                         Transactions
  Cash Flow                            Cash Flow
Wealth                               Wealth
  Goals                                Goals
  Loans                                Loans
  Investments                          Investments
Planning                             Home & lifestyle
  Rent vs Buy                          Rent vs Buy
  Mortgage vs Invest                   Mortgage vs Invest
  Rental Properties                    (Car: Buy vs Lease — future)
  Buy a Rental?                      Investing & rentals
  Scenarios                            Buy a Rental?
  Tax                                  My Rentals   ← renamed from "Rental Properties"
                                     Plan & model
                                       Scenarios
                                       Tax
```

Notes:

- Personal vs. investment shows up as two **adjacent groups**, not a hard app
  split. Shared/cross-cutting tools (Scenarios, Tax, Net Worth) stay unified —
  they're the connective tissue the decision engine runs on.
- Rename **Rental Properties → My Rentals** to disambiguate "track what I own"
  from "Buy a Rental?" (decide to invest).
- Optional enhancement: use the onboarding **intent** (already captured) to
  emphasize the relevant group first — a property investor lands on
  "Investing & rentals," a homebuyer on "Home & lifestyle." Personalized
  emphasis beats a fixed split.

**Why deferred:** this is exactly the kind of IA question the first watched
user session answers cheaply. Watch whether testers look for "home decisions"
separately from "investment decisions," and where they expect the rental tools
to live — then implement, rather than guessing now.

**Implementation is small:** it's the `navGroups` array in
`apps/web/src/app/dashboard/layout.tsx` plus a label rename; no backend change.
