import { render, screen } from '@testing-library/react'
import { DisclosurePanel, DisclosureBadge } from '../DisclosurePanel'
import type { DisclosurePayload } from '../disclosure.types'

describe('DisclosureBadge', () => {
  it('renders the kind label and exposes the kind for styling/testing', () => {
    render(<DisclosureBadge kind="projection" />)
    const badge = screen.getByTestId('disclosure-badge')
    expect(badge).toHaveTextContent('Projection')
    expect(badge).toHaveAttribute('data-disclosure-kind', 'projection')
  })

  it.each([
    ['projection', 'Projection'],
    ['estimate', 'Estimate'],
    ['snapshot', 'Snapshot'],
  ] as const)('labels %s as %s', (kind, label) => {
    render(<DisclosureBadge kind={kind} />)
    expect(screen.getByTestId('disclosure-badge')).toHaveTextContent(label)
  })
})

describe('DisclosurePanel', () => {
  it('falls back to the kind default framing when none is provided', () => {
    render(<DisclosurePanel payload={{ kind: 'projection' }} />)
    const panel = screen.getByTestId('disclosure-panel')
    expect(panel).toHaveAttribute('data-disclosure-kind', 'projection')
    expect(screen.getByText(/this is a projection, not a prediction/i)).toBeInTheDocument()
  })

  it('uses a custom title and framing when supplied', () => {
    render(
      <DisclosurePanel
        payload={{
          kind: 'estimate',
          title: 'How this estimate is built',
          framing: 'Custom framing.',
        }}
      />,
    )
    expect(screen.getByText('How this estimate is built')).toBeInTheDocument()
    expect(screen.getByText('Custom framing.')).toBeInTheDocument()
  })

  it('renders assumptions with their provenance labels', () => {
    const payload: DisclosurePayload = {
      kind: 'estimate',
      assumptions: [
        { label: 'Vacancy rate', value: '5%', source: 'user' },
        { label: 'Appreciation', value: '3%/yr', source: 'default' },
        { label: 'Gross income', value: '$120,000', source: 'derived' },
      ],
    }
    render(<DisclosurePanel payload={payload} />)
    expect(screen.getByText('Based on these assumptions')).toBeInTheDocument()
    expect(screen.getByText('You set this')).toBeInTheDocument()
    expect(screen.getByText('System default')).toBeInTheDocument()
    expect(screen.getByText('Derived from your inputs')).toBeInTheDocument()
    expect(screen.getByText('Vacancy rate')).toBeInTheDocument()
  })

  it('omits empty sections entirely', () => {
    render(<DisclosurePanel payload={{ kind: 'snapshot' }} />)
    expect(screen.queryByText('Based on these assumptions')).not.toBeInTheDocument()
    expect(screen.queryByText('Not modeled')).not.toBeInTheDocument()
    expect(screen.queryByText('Things to know')).not.toBeInTheDocument()
  })

  it('renders "Not modeled" and "Things to know" list items', () => {
    render(
      <DisclosurePanel
        payload={{
          kind: 'projection',
          notModeled: ['Market volatility'],
          caveats: ['Distant years are less reliable'],
        }}
      />,
    )
    expect(screen.getByText('Not modeled')).toBeInTheDocument()
    expect(screen.getByText('Market volatility')).toBeInTheDocument()
    expect(screen.getByText('Things to know')).toBeInTheDocument()
    expect(screen.getByText('Distant years are less reliable')).toBeInTheDocument()
  })
})
