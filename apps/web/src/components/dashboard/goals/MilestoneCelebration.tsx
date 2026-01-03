'use client'

import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import type { GoalProgressWithInsights } from '@finance-app/shared-types'

interface MilestoneCelebrationProps {
  goals: GoalProgressWithInsights[]
}

interface CelebrationData {
  goalName: string
  milestone: number
  goalId: string
}

const MILESTONE_MESSAGES: Record<number, { title: string; description: string }> = {
  25: {
    title: 'Great Start!',
    description: "You've reached 25% of your goal. Keep up the momentum!",
  },
  50: {
    title: 'Halfway There!',
    description: "Amazing progress! You're now 50% of the way to your goal.",
  },
  75: {
    title: 'Almost There!',
    description: "Incredible! You've completed 75% of your goal. The finish line is in sight!",
  },
  100: {
    title: 'Goal Achieved!',
    description: "Congratulations! You've reached your goal. What an achievement!",
  },
}

const CELEBRATION_STORAGE_KEY = 'celebrated_milestones'

function getCelebratedMilestones(): Record<string, number[]> {
  if (typeof window === 'undefined') return {}
  try {
    const stored = localStorage.getItem(CELEBRATION_STORAGE_KEY)
    return stored ? JSON.parse(stored) : {}
  } catch {
    return {}
  }
}

function saveCelebratedMilestone(goalId: string, milestone: number): void {
  if (typeof window === 'undefined') return
  const current = getCelebratedMilestones()
  if (!current[goalId]) {
    current[goalId] = []
  }
  if (!current[goalId].includes(milestone)) {
    current[goalId].push(milestone)
    localStorage.setItem(CELEBRATION_STORAGE_KEY, JSON.stringify(current))
  }
}

export function MilestoneCelebration({ goals }: MilestoneCelebrationProps) {
  const [celebration, setCelebration] = useState<CelebrationData | null>(null)

  useEffect(() => {
    // Check for new milestones to celebrate
    const celebrated = getCelebratedMilestones()

    for (const goal of goals) {
      const goalCelebrated = celebrated[goal.goal.id] || []

      for (const milestone of goal.insights.milestones) {
        if (milestone.reached && !goalCelebrated.includes(milestone.percent)) {
          // Found a new milestone to celebrate
          setCelebration({
            goalName: goal.goal.name,
            milestone: milestone.percent,
            goalId: goal.goal.id,
          })
          return // Only show one celebration at a time
        }
      }
    }
  }, [goals])

  const handleClose = () => {
    if (celebration) {
      saveCelebratedMilestone(celebration.goalId, celebration.milestone)
      setCelebration(null)
    }
  }

  if (!celebration) return null

  const message = MILESTONE_MESSAGES[celebration.milestone]
  if (!message) return null

  return (
    <Dialog open={!!celebration} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md text-center">
        <DialogHeader>
          <div className="mx-auto mb-4 text-6xl">
            {celebration.milestone === 100 ? '🎉' : celebration.milestone >= 75 ? '🌟' : '✨'}
          </div>
          <DialogTitle className="text-2xl">{message.title}</DialogTitle>
          <DialogDescription className="text-base pt-2">
            <span className="font-semibold text-foreground">{celebration.goalName}</span>
            <br />
            {message.description}
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-center gap-2 mt-4">
          {[25, 50, 75, 100].map((m) => (
            <div
              key={m}
              className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold ${
                m <= celebration.milestone
                  ? 'bg-green-100 text-green-800 border-2 border-green-500'
                  : 'bg-gray-100 text-gray-400'
              }`}
            >
              {m}%
            </div>
          ))}
        </div>

        <div className="mt-6">
          <Button onClick={handleClose} className="w-full">
            {celebration.milestone === 100 ? 'Celebrate!' : 'Keep Going!'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
