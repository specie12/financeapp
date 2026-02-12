import { Injectable } from '@nestjs/common'
import { OnEvent } from '@nestjs/event-emitter'
import { NotificationsService } from './notifications.service'

export interface BudgetExceededEvent {
  userId: string
  budgetId: string
  categoryName: string
  percentUsed: number
  budgetedAmountCents: number
  spentAmountCents: number
}

export interface GoalMilestoneEvent {
  userId: string
  goalId: string
  goalName: string
  milestonePercent: number
}

export interface LargeTransactionEvent {
  userId: string
  transactionId: string
  description: string
  amountCents: number
}

@Injectable()
export class NotificationTriggersService {
  constructor(private readonly notificationsService: NotificationsService) {}

  @OnEvent('budget.exceeded')
  async handleBudgetExceeded(event: BudgetExceededEvent): Promise<void> {
    const level = event.percentUsed >= 100 ? 'exceeded' : 'at 80%'
    await this.notificationsService.createNotification({
      userId: event.userId,
      type: 'budget_exceeded',
      title: `Budget ${level}: ${event.categoryName}`,
      message: `Your ${event.categoryName} budget is ${level}. You've spent $${(event.spentAmountCents / 100).toFixed(2)} of your $${(event.budgetedAmountCents / 100).toFixed(2)} budget (${Math.round(event.percentUsed)}%).`,
      metadata: {
        budgetId: event.budgetId,
        percentUsed: event.percentUsed,
      },
    })
  }

  @OnEvent('goal.milestone')
  async handleGoalMilestone(event: GoalMilestoneEvent): Promise<void> {
    await this.notificationsService.createNotification({
      userId: event.userId,
      type: 'goal_milestone',
      title: `Goal Milestone: ${event.goalName}`,
      message: `Congratulations! You've reached ${event.milestonePercent}% of your "${event.goalName}" goal.`,
      metadata: {
        goalId: event.goalId,
        milestonePercent: event.milestonePercent,
      },
    })
  }

  @OnEvent('transaction.large')
  async handleLargeTransaction(event: LargeTransactionEvent): Promise<void> {
    await this.notificationsService.createNotification({
      userId: event.userId,
      type: 'large_transaction',
      title: 'Large Transaction Detected',
      message: `A large transaction of $${(event.amountCents / 100).toFixed(2)} was recorded: "${event.description}".`,
      metadata: {
        transactionId: event.transactionId,
        amountCents: event.amountCents,
      },
    })
  }
}
