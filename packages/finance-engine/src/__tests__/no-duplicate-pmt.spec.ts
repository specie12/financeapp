import { execSync } from 'node:child_process'
import { resolve } from 'node:path'

/**
 * Regression guard for P0.1: PMT math must live ONLY in the canonical
 * finance-engine. If a future change reintroduces a `Math.pow(1 + ...)`
 * (or equivalent monthly compounding formula) anywhere outside this engine,
 * this test fails — preventing the duplicates that produced numerical
 * drift between onboarding, settings, dashboard, and the API.
 *
 * Allowed call sites: only the canonical engine itself.
 */
describe('No duplicate PMT implementations', () => {
  // Resolved relative to packages/finance-engine — go up two levels to repo root.
  const repoRoot = resolve(__dirname, '..', '..', '..', '..')

  const grep = (pattern: string, paths: string[]): string[] => {
    try {
      const out = execSync(
        // Exclude test directories — the test source files themselves reference
        // the forbidden patterns by description, which is fine.
        `grep -rn --include='*.ts' --include='*.tsx' --exclude-dir='__tests__' ${JSON.stringify(
          pattern,
        )} ${paths.map((p) => JSON.stringify(p)).join(' ')}`,
        { cwd: repoRoot, encoding: 'utf8' },
      )
      return out
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean)
    } catch (err) {
      // grep exits 1 when nothing matches — that is the desired outcome.
      const code = (err as { status?: number }).status
      if (code === 1) return []
      throw err
    }
  }

  it('Math.pow(1 + ...) compounding does not appear in any app or in the engine (canonical PMT uses Decimal.pow)', () => {
    // After P0.1 (apps) and P0.2 (mortgage-vs-invest engine), there should
    // be NO float-based monthly compounding anywhere in the repo. The
    // canonical PMT in `amortization.ts` uses `Decimal.pow`, never `Math.pow`.
    const hits = grep('Math.pow(1 +', [
      'apps/web/src',
      'apps/mobile/src',
      'apps/api/src',
      'packages/finance-engine/src',
    ])
    expect(hits).toEqual([])
  })

  it('no `monthlyRate` PMT-style formula appears in web or mobile', () => {
    // The substring "monthlyRate" itself is fine as a variable name; what we
    // forbid is a *PMT-shaped* expression in client code. The simplest signal
    // is `Math.pow(1 + monthlyRate` which is what every textbook PMT uses.
    const hits = grep('Math.pow(1 + monthlyRate', ['apps/web/src', 'apps/mobile/src'])
    expect(hits).toEqual([])
  })

  it('no PMT formula in apps/api/src/calculators/calculators.service.ts (must call engine)', () => {
    const hits = grep('Math.pow', ['apps/api/src/calculators/calculators.service.ts'])
    expect(hits).toEqual([])
  })
})
