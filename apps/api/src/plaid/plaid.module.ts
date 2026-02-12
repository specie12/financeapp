import { Module } from '@nestjs/common'
import { PlaidController } from './plaid.controller'
import { PlaidService } from './plaid.service'
import { PlanLimitsModule } from '../plan-limits/plan-limits.module'

@Module({
  imports: [PlanLimitsModule],
  controllers: [PlaidController],
  providers: [PlaidService],
  exports: [PlaidService],
})
export class PlaidModule {}
