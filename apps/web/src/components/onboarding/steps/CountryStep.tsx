'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { Country } from '@finance-app/shared-types'
import {
  SUPPORTED_COUNTRIES,
  COMING_SOON_COUNTRIES,
  COUNTRY_NAMES,
} from '@finance-app/shared-types'

interface CountryStepProps {
  country: Country
  onSetCountry: (country: Country) => void
  onNext: () => void
  onBack: () => void
}

const COUNTRY_FLAGS: Record<Country, string> = {
  US: '🇺🇸',
  UK: '🇬🇧',
  CA: '🇨🇦',
}

export function CountryStep({ country, onSetCountry, onNext, onBack }: CountryStepProps) {
  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <CardTitle>Select Your Country</CardTitle>
        <CardDescription>
          We&apos;ll customize your experience based on your location
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4">
          {/* Supported Countries */}
          {SUPPORTED_COUNTRIES.map((c) => (
            <button
              key={c}
              onClick={() => onSetCountry(c)}
              className={cn(
                'flex items-center gap-4 p-4 rounded-lg border-2 transition-all text-left w-full',
                country === c
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50',
              )}
            >
              <span className="text-4xl">{COUNTRY_FLAGS[c]}</span>
              <div>
                <div className="font-medium">{COUNTRY_NAMES[c]}</div>
                <div className="text-sm text-muted-foreground">Full support available</div>
              </div>
              {country === c && (
                <div className="ml-auto text-primary">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
              )}
            </button>
          ))}

          {/* Coming Soon Countries */}
          {COMING_SOON_COUNTRIES.map((c) => (
            <div
              key={c}
              className="flex items-center gap-4 p-4 rounded-lg border-2 border-border opacity-60 cursor-not-allowed"
            >
              <span className="text-4xl grayscale">{COUNTRY_FLAGS[c]}</span>
              <div>
                <div className="font-medium">{COUNTRY_NAMES[c]}</div>
                <div className="text-sm text-muted-foreground">Coming Soon</div>
              </div>
              <div className="ml-auto">
                <span className="text-xs bg-muted px-2 py-1 rounded-full">Coming Soon</span>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-4 pt-4">
          <Button variant="outline" onClick={onBack} className="flex-1">
            Back
          </Button>
          <Button onClick={onNext} className="flex-1">
            Continue
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
