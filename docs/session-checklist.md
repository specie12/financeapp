# Watched Session Checklist (Phase 1 — Validate)

**Companion to:** `roadmap.md` (M1.1), `path-to-first-user.md`
A ready-to-run guide for a single watched validation session on this app. Print
it or keep it open beside you. **Your job during the session is to shut up and
watch** — struggle is the signal.

---

## 1. Before the session (~10 min setup)

Start the local stack (it's localhost — do this in person or over screen-share):

```
brew services start postgresql@15        # if not already running
pnpm api dev                             # API on :3006
pnpm web dev                             # web on :3000  ← this is the URL
```

- [ ] **Dry-run it yourself first** (2 min): fresh signup → onboarding → the
      decision tool. Confirm nothing's broken before a real person sits down.
- [ ] Open `http://localhost:3000` ready on the login/signup screen.
- [ ] Notepad ready. Pre-write your **pass bar** (see §6) so you can't move it later.
- [ ] Optional pre-populated login: `demo@example.com` / `Password123!` — but a
      **fresh signup is the better test** (you learn from onboarding too).
- [ ] Recruit: **one person with a real, live money decision** — actively weighing
      rent-vs-buy, or whether to buy a specific rental. One real decision beats
      ten hypotheticals.

---

## 2. The setup line (what you say, then go quiet)

> "This is an early prototype I'm testing. I'll mostly stay quiet and watch — if
> anything is confusing, that's the tool's fault, not yours, and it's exactly what
> I need to see. Please think out loud."

Then give them a **real task** (pick the one that matches their actual decision)
and **stop talking**:

- **Homebuyer:** "You're deciding whether to buy [the place you're considering] or
  keep renting. Use this to figure it out."
- **Property investor:** "You're deciding whether to buy [a rental you're looking
  at]. Use this to figure it out."

---

## 3. Tasks (match to their real decision)

**Task A — Rent vs Buy** (homebuyer)
Sign up → onboarding → find Rent vs Buy → enter their real numbers → reach a
recommendation.

**Task B — Should I buy this rental?** (investor)
Sign up → onboarding → find "Buy a Rental?" → enter a real candidate → read the
verdict, the with/without net-worth impact, and the Monte Carlo range.

**Task C — Scenarios** (optional, if time — the surface we just fixed)
Create or edit a scenario, change a value, click Update → confirm it works and
they understand the projection.

---

## 4. What to watch for (the observation grid)

Note where they pause, backtrack, squint, or say "huh." **Every time you want to
jump in and explain something = a finding. Write it down instead of helping.**

- **Onboarding:** Do they finish? Where do they hesitate? Does the "what brought
  you here?" intent step make sense? Do they try to skip data entry?
- **Finding the tool:** Can they locate it in the nav? Do they look for "home"
  decisions separately from "investment" ones? _(This settles the nav-regroup
  question in `ux-backlog.md` — decide by what they do.)_
- **Entering data:** What's confusing? Units (dollars vs cents)? Fields they
  expected but didn't find? Anything they had to guess?
- **The output:** Do they **believe** the number? Do they read the disclosure
  panel or ignore it? Do they grasp "projection, not prediction"? What do they do
  next — act, or stall?
- **Emotional tells:** lean in / lean back, "oh nice," a frown, re-reading a line.

---

## 5. Questions to ask AFTER (never during) — the Mom Test

Ask about their real life and past behavior, not hypothetical futures:

- "What did you expect to happen there?" (at each stumble)
- "How do you make this decision **today**?" (spreadsheet / advisor / gut)
- "What would you need to see to **trust** this number?"
- "Walk me through the **last time** you made a money decision like this."
- Only near the end: "What would make you use this for your **next** decision
  instead of your current way?"

**Avoid** as openers: "Do you like it?" / "Would you use it?" / "Would you pay?"
— they generate polite lies. Watch behavior; infer demand.

---

## 6. The pass bar (commit BEFORE the session)

Write it down now so you can't rationalize afterward. Suggested:

> _"Across sessions, ≥2 of 3 reach a decision they trust — without me
> intervening — and describe a real next decision they'd bring back to it."_

---

## 7. After each session (~10 min)

- [ ] Dump raw notes **immediately** (memory fades fast).
- [ ] Add observations to the **"Running list: validation findings"** in
      `roadmap.md`.
- [ ] Triage each: **blocker** (fix before the next session) / nice-to-have /
      signal about direction.
- [ ] Fast-loop the blockers (the way the scenario bug got fixed same-day).

---

## 8. Anti-patterns (don't)

- Demoing instead of watching.
- Leading, explaining, or defending the design.
- Treating politeness ("this is nice!") as validation.
- Building a feature because **one** tester wished for it — wait for a pattern.

---

## Practical notes for this app

- Web runs on **:3000** (the `PORT=3002` in `.env.local` isn't used by `next dev`).
- Investments show a **"Demo data"** banner — that's expected and honestly labeled.
- A fresh signup persists correctly all the way to the decision tools (dry-run
  verified).
