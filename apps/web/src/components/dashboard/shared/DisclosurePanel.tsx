'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { DisclosurePayload, DisclosureKind } from './disclosure.types'

interface DisclosurePanelProps {
  payload: DisclosurePayload
}

const KIND_LABEL: Record<DisclosureKind, string> = {
  projection: 'Projection',
  estimate: 'Estimate',
  snapshot: 'Snapshot',
}

const KIND_DEFAULT_FRAMING: Record<DisclosureKind, string> = {
  projection:
    'This is a projection, not a prediction. Results depend on the assumptions below; changing any assumption changes the outcome.',
  estimate:
    'This is an estimate based on the inputs and defaults below. It is not a guarantee of future results.',
  snapshot:
    'This reflects the data you have entered today. Missing inputs are surfaced explicitly — no value is fabricated.',
}

const KIND_BADGE_CLASS: Record<DisclosureKind, string> = {
  projection: 'bg-amber-50 text-amber-900 border-amber-200',
  estimate: 'bg-sky-50 text-sky-900 border-sky-200',
  snapshot: 'bg-slate-50 text-slate-900 border-slate-200',
}

const SOURCE_LABEL = {
  user: 'You set this',
  default: 'System default',
  derived: 'Derived from your inputs',
} as const

/**
 * Discloses how a financial output was produced. Renders nothing when the
 * payload is empty (no assumptions, no exclusions, no caveats) — but the
 * kind framing always shows so users know what they're looking at.
 *
 * Visual treatment is intentionally calm: low-saturation badges, plain
 * lists, no compliance-theater language. The goal is "you can quickly see
 * what we assumed and what we didn't model" — not "scary disclaimer."
 */
export function DisclosurePanel({ payload }: DisclosurePanelProps) {
  const { kind, title, framing, assumptions = [], notModeled = [], caveats = [] } = payload

  const headerLabel = title ?? KIND_LABEL[kind]
  const framingText = framing ?? KIND_DEFAULT_FRAMING[kind]

  return (
    <Card data-testid="disclosure-panel" data-disclosure-kind={kind}>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={KIND_BADGE_CLASS[kind]}>
            {headerLabel}
          </Badge>
          <CardTitle className="text-base font-medium">How this was calculated</CardTitle>
        </div>
        <p className="text-sm text-muted-foreground">{framingText}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {assumptions.length > 0 && (
          <section>
            <h4 className="text-sm font-medium mb-2">Based on these assumptions</h4>
            <ul className="space-y-1.5 text-sm">
              {assumptions.map((a, i) => (
                <li key={`${a.label}-${i}`} className="flex items-start justify-between gap-3">
                  <div>
                    <span className="font-medium">{a.label}</span>
                    {a.note && <span className="text-muted-foreground"> — {a.note}</span>}
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-mono text-sm">{a.value}</div>
                    <div className="text-[11px] text-muted-foreground leading-tight">
                      {SOURCE_LABEL[a.source]}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        {notModeled.length > 0 && (
          <section>
            <h4 className="text-sm font-medium mb-2">Not modeled</h4>
            <ul className="space-y-1 text-sm text-muted-foreground list-disc pl-5">
              {notModeled.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </section>
        )}

        {caveats.length > 0 && (
          <section>
            <h4 className="text-sm font-medium mb-2">Things to know</h4>
            <ul className="space-y-1 text-sm text-muted-foreground list-disc pl-5">
              {caveats.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </section>
        )}
      </CardContent>
    </Card>
  )
}

/**
 * Tiny inline badge for hero recommendation cards. Use this where you want
 * to mark a headline number as projection/estimate without adding the full
 * DisclosurePanel.
 */
export function DisclosureBadge({ kind }: { kind: DisclosureKind }) {
  return (
    <Badge
      variant="outline"
      className={`${KIND_BADGE_CLASS[kind]} text-[11px] font-medium`}
      data-testid="disclosure-badge"
      data-disclosure-kind={kind}
    >
      {KIND_LABEL[kind]}
    </Badge>
  )
}
