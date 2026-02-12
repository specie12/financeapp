import { Module } from '@nestjs/common'
import { AiController } from './ai.controller'
import { AiService } from './ai.service'
import { PromptBuilderService } from './prompt-builder.service'
import { AiAnomalyService } from './ai-anomaly.service'
import { AiPredictionService } from './ai-prediction.service'
import { DashboardModule } from '../dashboard/dashboard.module'
import { GoalsModule } from '../goals/goals.module'
import { AccountsModule } from '../accounts/accounts.module'
import { TransactionsModule } from '../transactions/transactions.module'
import { NotificationsModule } from '../notifications/notifications.module'

@Module({
  imports: [DashboardModule, GoalsModule, AccountsModule, TransactionsModule, NotificationsModule],
  controllers: [AiController],
  providers: [AiService, PromptBuilderService, AiAnomalyService, AiPredictionService],
})
export class AiModule {}
