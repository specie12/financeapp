import { Module } from '@nestjs/common'
import { TaxController } from './tax.controller'
import { TaxService } from './tax.service'
import { PlanLimitsModule } from '../plan-limits/plan-limits.module'

@Module({
  imports: [PlanLimitsModule],
  controllers: [TaxController],
  providers: [TaxService],
  exports: [TaxService],
})
export class TaxModule {}
