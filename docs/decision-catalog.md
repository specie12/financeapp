# Decision Catalog: The Prioritized Build Order for a Financial-Decisions Engine

**Date:** July 5, 2026
**Companion to:** `positioning.md`
**Voice:** Founder-honest. Internal roadmap tool, not a pitch.

> **Frame:** The product is an all-in-one finance/investment platform whose
> identity is a **decision engine** — every major money fork, modeled honestly
> against the user's real data, in one place. This catalog lists those
> decisions, what already exists, and where the real money hides, in the order
> worth building.

Legend: ✅ built · 🟡 partial · ⬜ not built

---

## The base that already exists (the fuel)

These aren't the differentiator, but they're the data the engine runs on, and
most are done:

| Surface                                            | Status                             |
| -------------------------------------------------- | ---------------------------------- |
| Net worth + year-by-year projection                | ✅                                 |
| Monte Carlo (p10/p50/p90 outcome bands)            | ✅                                 |
| Scenario engine (entity overrides, compare)        | ✅                                 |
| Rent vs buy                                        | ✅                                 |
| Mortgage vs invest                                 | ✅                                 |
| Rental analysis + "Should I buy this rental?" flow | ✅                                 |
| Loans / payoff (amortization)                      | ✅ (avalanche/snowball 🟡)         |
| Budgeting, cash flow, transactions                 | ✅                                 |
| Investments + dividends                            | ✅ / 🟡 (yield-based, no calendar) |
| Tax summary + brackets                             | 🟡 (reporting, not strategy)       |
| Goals, AI advice/chat/query, Plaid                 | ✅ / ✅ / 🟡 (sandbox)             |

The gap isn't tracking — it's the **decisions** layered on top.

---

## Tier 1 — Where the hidden money is (build next)

These are the highest dollar-per-user levers and the most under-served. If the
identity is "help people decide," this is the sharpest edge.

**1. Tax as a cross-cutting _layer_, not a page.** ⬜ (tax is 🟡 today)
The single biggest hidden-money lever, and it makes every existing tool more
correct (after-tax is the only number that matters).

- **Asset location** — same portfolio, right accounts (bonds in tax-advantaged,
  growth in Roth). Quietly worth five figures over decades; almost no consumer
  app does it.
- **Tax-loss harvesting** and **capital-gains timing** (short vs long-term).
- **Roth conversion analysis** — "convert $X this year in a low bracket."

**2. Insurance adequacy — "Am I underinsured?"** ⬜
High-stakes, emotionally resonant, and _totally unclaimed_ by finance apps.
Life (DIME method), disability, umbrella. A genuine decision nobody helps with.

**3. Fee & drag analyzer.** ⬜
Expense ratios, advisor fees, and cash drag shown in **lifetime dollars**.
Empower's most-praised feature; flagged in `competitive-analysis-empower.md`.
Concrete, and it makes people angry at their current setup — good for switching.

---

## Tier 2 — High-stakes life decisions people get wrong

**4. Retirement / withdrawal strategy + Social Security claiming.** ⬜
The biggest decisions people face; the Monte Carlo engine already does the hard
modeling. Withdrawal order, 4%-rule vs guardrails, sequence-of-returns risk. And
**Social Security claiming age (62 vs 67 vs 70)** is a five-figure decision that
is genuinely under-served.

**5. Refinance / debt-restructuring engine.** ⬜ (payoff exists ✅)
Rate-sensitive decisions that recur every time rates move: refi break-even,
cash-out analysis, HELOC strategy, debt consolidation, **PMI-removal timing**,
student-loan strategy (IDR vs refinance vs forgiveness).

**6. Equity compensation (RSU / ISO / NSO / ESPP).** ⬜
Where the high-earner segment (the one that _pays_) has real money and hates the
admin. Vesting schedules, concentration risk, AMT on ISOs, sell-to-diversify.
Existing tools (Carta, Secfi) are narrow.

---

## Tier 3 — Risk surfacing + engagement

**7. Concentration & liquidity health.** ⬜
"42% of your net worth is one stock / your employer." "You have 3 weeks of liquid
runway." Surfacing risk _triggers_ decisions — the whole thesis.

**8. Car: buy vs lease vs finance.** ⬜
The founder listed it; nobody does it integrated. Fits the decision-tools engine.

**9. Dividend calendar.** 🟡 → ⬜
Real ex-date / payment timing + DRIP, not just yield × value.

**10. Benchmarking + life-event scenario templates.** ⬜
"You're in the 70th percentile for your age/income" (proven retention driver).
Pre-built what-if templates for job loss, new baby, home purchase, inheritance —
the scenario engine already supports the modeling.

---

## Three advantages that aren't tools

- **Proactivity.** The difference between a tool and an advisor is that the
  advisor tells you _when to act_: "rates dropped — refinancing now breaks even
  in 14 months." Nudges turn a calculator into a relationship.
- **You compete with advisors (1% AUM ≈ $3–10k/yr), not $10/mo apps.** Framing
  the product as an _advice engine_ lifts pricing power.
- **Tax-awareness as a property of every calculation**, not a feature. (See Tier 1.)

---

## The regulatory line (where the moat earns its keep)

Tax, insurance, retirement, and Social Security edge toward _regulated financial
advice_. The way to win rather than get in trouble is the existing strength:
frame everything as **education and modeling with transparent assumptions**. The
Assumption & Disclosure Layer is what makes an advice engine defensible — the
moat doing double duty.

---

## Recommended sequencing

Not all of Tier 1–3 at once. If I had to order the next builds:

1. **Tax-aware asset location + Roth-conversion analysis** — most hidden money,
   and it upgrades every tool already built.
2. **Insurance adequacy** — high-stakes, emotionally resonant, totally unclaimed;
   cheap to model, strong "whoa" factor.
3. **Fee & drag analyzer** — concrete, switch-inducing, low effort on existing
   investment data.
4. **Refinance/debt-restructuring engine** — recurring, rate-sensitive, extends
   the loans module.
5. **Retirement withdrawal + Social Security claiming** — biggest life decision;
   reuses Monte Carlo.

Everything above assumes the prior gate from `positioning.md` still holds: **get
it in front of one real user first.** The catalog is what to build _once the
wedge validates_ — not a reason to keep building instead of validating.
