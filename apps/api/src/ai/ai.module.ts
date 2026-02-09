import { Module } from '@nestjs/common'
import { AiController } from './ai.controller'
import { AiService } from './ai.service'
import { PromptBuilderService } from './prompt-builder.service'
import { DashboardModule } from '../dashboard/dashboard.module'
import { GoalsModule } from '../goals/goals.module'

@Module({
  imports: [DashboardModule, GoalsModule],
  controllers: [AiController],
  providers: [AiService, PromptBuilderService],
})
export class AiModule {}
