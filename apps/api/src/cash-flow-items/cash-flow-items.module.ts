import { Module } from '@nestjs/common'
import { CashFlowItemsController } from './cash-flow-items.controller'
import { CashFlowItemsService } from './cash-flow-items.service'

@Module({
  controllers: [CashFlowItemsController],
  providers: [CashFlowItemsService],
  exports: [CashFlowItemsService],
})
export class CashFlowItemsModule {}
