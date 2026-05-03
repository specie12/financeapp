/**
 * Assumption & Disclosure Layer types.
 *
 * Every user-facing financial output should be classifiable as one of four
 * provenance kinds: a user input, an exact calculation derived from inputs,
 * an estimate / assumption-driven number, or a factor we did not model.
 *
 * The DisclosurePanel surfaces the latter three so users can interpret the
 * numbers correctly. This file defines the shared shape; per-surface
 * helpers turn API responses or form state into a payload the panel can
 * render.
 */

/**
 * The kind of output the surface is producing. Drives the headline label
 * and color treatment in the panel.
 *
 *  - "projection" — long-horizon forecast that compounds assumptions.
 *  - "estimate"   — single-shot calculation that mixes facts and assumptions.
 *  - "snapshot"   — current-state aggregation. No assumptions, but may have
 *                   missing data (e.g. cost basis not set on every holding).
 */
export type DisclosureKind = 'projection' | 'estimate' | 'snapshot'

/**
 * A single assumption that drove the output.
 *
 *  - source = "user"    — the user explicitly provided this in the form.
 *  - source = "default" — the system used its built-in default.
 *  - source = "derived" — the system computed it from other user inputs.
 */
export interface DisclosureAssumption {
  label: string
  value: string
  source: 'user' | 'default' | 'derived'
  /** Optional one-line explanation of what this affects. */
  note?: string
}

/**
 * Structured payload the panel renders. Empty arrays render nothing —
 * keep the visual footprint zero when there's nothing to disclose.
 */
export interface DisclosurePayload {
  kind: DisclosureKind
  /** Short heading. Defaults: "Projection", "Estimate", "Snapshot". */
  title?: string
  /** One sentence framing the output. Defaults to a kind-appropriate string. */
  framing?: string
  /** Inputs and defaults that shaped the numbers. */
  assumptions?: DisclosureAssumption[]
  /** Factors intentionally excluded from the calculation. */
  notModeled?: string[]
  /** Other caveats the user should weight when interpreting. */
  caveats?: string[]
}
