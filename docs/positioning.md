# Positioning Brief: Pick the Wedge, Cut the Rest

**Date:** July 5, 2026
**Companion to:** `competitive-analysis-empower.md`
**Voice:** Founder-honest. Internal thinking tool, not a pitch.

> **Thesis:** The breadth is already built. The job now is not to add features or
> match Empower feature-for-feature — it's to pick one wedge, one first user, and
> lead with the one thing nobody else is doing: honesty about uncertainty.

---

## Why this doc exists

This project started from a ChatGPT conversation that asked, roughly, "does an
all-in-one finance app exist, and what should I add?" The answer validated a
breadth-first premise — build mortgage, rentals, budgeting, investments, loans,
dividends, and AI all at once — and framed "no app combines all of this" as pure
opportunity.

That framing is half right and half dangerous.

**"No one does all of it" is at least as much a warning as an opportunity.** The
all-in-one finance category is a graveyard: Mint is dead, Personal Capital got
absorbed into Empower. The reason nobody combines everything isn't that nobody
thought of it — it's that breadth is expensive to run (Plaid economics, regulatory
surface, maintenance) and users don't actually want one app to do fifteen things
adequately. They want the one thing they care about done extremely well.

Two things have since made the original question obsolete:

1. **The breadth is already built.** Rent-vs-buy, mortgage-vs-invest, scenarios,
   rental analytics, tax, investments, AI, Plaid — the differentiators the original
   analysis said to build already exist in this repo.
2. **The recent work is the opposite of expansion.** The last stretch has been
   _trust hardening_ — closing P0 audit findings, adding regression/contract tests,
   and shipping the Assumption & Disclosure Layer so a projection isn't mistaken for
   a prediction.

That pivot is the most mature instinct in the project, and it answers the real
lesson the original analysis never gave: **in finance, breadth is worthless without
trustworthiness.** The strategic question has flipped from _"what do I include?"_ to
_"what's the wedge, who's the first user, and what do I cut?"_

---

## The wedge

Lead with **real-estate + scenario decision tools**, not budgeting.

| Surface                | Why it's the wedge                                                                                                                                             |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Rent vs Buy**        | Year-by-year cost model + affordability against real income. Calculator apps do the math but aren't linked to your data; aggregators don't do the math at all. |
| **Mortgage vs Invest** | Extra-principal vs investing, with capital-gains and deductibility modeling and a break-even rate. Genuinely rare.                                             |
| **Rental analytics**   | NOI, cap rate, cash-on-cash, GRM, DSCR per property + portfolio roll-up. Empower has _nothing_ here.                                                           |
| **Scenario engine**    | Entity-level overrides, side-by-side comparison, multi-year horizons — "what if I buy the rental / take the pay cut / pay off the mortgage."                   |

This is the one cluster where the app is genuinely deeper than Empower and Copilot
_and_ the persona has real willingness to pay.

**The contrast that matters:** budgeting and expense tracking are the crowded,
low-differentiation part of the map (YNAB, Simplifi, Monarch, the ghost of Mint).
They're a _retention_ feature — reasons people stay — not an _acquisition_ wedge.
Nobody switches finance apps because the budgeting is 15% better. Keep it; don't
lead with it.

---

## The first user

One sharp persona, not "everyone with money":

> **The aspiring or current property owner who is also a self-directed planner** —
> FIRE / Bogleheads-adjacent, comfortable running their own numbers, actively making
> a rent-vs-buy or buy-vs-invest decision, possibly holding one or two rentals.

They already open spreadsheets to do this. They pay for tools that save them the
spreadsheet. They congregate in findable communities. And they map exactly onto the
wedge above. Build and market to _this person_, not to a demographic.

---

## Trust is the real moat

The single most defensible, currently-unclaimed position isn't any one calculator —
it's the **Assumption & Disclosure Layer**
(`apps/web/src/components/dashboard/shared/`, now across rent-vs-buy,
mortgage-vs-invest, net-worth, goals, loans, scenarios, and tax).

Every competitor either hides its assumptions or doesn't have any (they just
aggregate). "Finance software that is honest about its own uncertainty — that tells
you what's a projection vs a fact, what it assumed, and what it didn't model" is a
real, differentiated, and unclaimed stance. It's also the perfect fit for a
skeptical, self-directed persona who distrusts black boxes.

This may out-differentiate any single feature. Lean into it as _brand_, not just UI.

---

## What to cut or defer

- **Treat "all-in-one" as a destination, not a launch requirement.** You can _have_
  the breadth in the codebase and still _market_ one sharp thing. Nobody adopts an
  app because it does everything passably.
- **Don't chase Empower on Empower's turf.** Feature-parity items that fight where
  they're already strong (see below) are low-wedge and high-effort.
- **Demote budgeting/expense tracking in the narrative.** Ship it, keep it good,
  don't make it the headline.

---

## Reconciling with the competitive doc

The companion `competitive-analysis-empower.md` answers _how to match Empower_. This
doc answers _whether to_ — and mostly argues not to. Re-sequencing its priorities
through a wedge-first lens:

| Item (from competitive doc)      | Its call | Wedge-first call    | Why                                                                                                                                        |
| -------------------------------- | -------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| **Live market data API**         | P0       | **Keep, near-term** | Table stakes _for the investment surface the wedge relies on_. Infra already exists; it's a config change.                                 |
| **Monte Carlo simulation**       | P1       | **Keep**            | Directly strengthens the scenario wedge — probabilistic "what-if" is exactly the persona's language.                                       |
| **Fee analyzer**                 | P0       | **Defer**           | Pure Empower-parity play on their strongest turf. High effort, low wedge value. Not why our persona shows up.                              |
| **Empower-migration onboarding** | P1       | **Conditional**     | Only worth it if the wedge persona overlaps Empower refugees. Otherwise it's chasing a different audience than the one we're building for. |
| **Secondary bank aggregator**    | P2       | **Defer**           | Breadth/reliability investment; matters at scale, not at wedge-finding.                                                                    |

The competitive doc isn't wrong — it's a good map of the Empower fight. It's just
answering a question one altitude too low. Match it _after_ the wedge lands, not
before.

---

## Bottom line

1. **Pick the wedge:** real-estate + scenario decision tools. Lead with it.
2. **Pick the person:** the self-directed property planner. Build and market to them.
3. **Lead with trust:** the disclosure layer is the brand, not a footnote.
4. **Keep breadth in the code, not in the pitch.** Defer parity features (fee
   analyzer, second aggregator) that fight Empower where it's strong.
