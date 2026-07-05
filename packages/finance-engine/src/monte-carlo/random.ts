/**
 * Seeded, deterministic pseudo-random number generator for Monte Carlo.
 *
 * The engine forbids `Math.random` so results are reproducible and testable —
 * a given seed always produces the same sequence, and therefore the same
 * outcome bands. This is `mulberry32` (a well-known 32-bit PRNG) plus a
 * Box-Muller transform for standard-normal samples.
 */
export interface Rng {
  /** Uniform sample in [0, 1). */
  next(): number
  /** Standard-normal sample (mean 0, sd 1) via Box-Muller. */
  nextNormal(): number
}

export function createRng(seed: number): Rng {
  let a = seed >>> 0

  const nextUniform = (): number => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }

  return {
    next: nextUniform,
    nextNormal(): number {
      // Box-Muller. Guard the log against a zero draw.
      let u = nextUniform()
      const v = nextUniform()
      if (u < 1e-12) u = 1e-12
      return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
    },
  }
}
