import { Module } from '@nestjs/common'
import { RentalPropertiesController } from './rental-properties.controller'
import { RentalPropertiesService } from './rental-properties.service'

@Module({
  controllers: [RentalPropertiesController],
  providers: [RentalPropertiesService],
  exports: [RentalPropertiesService],
})
export class RentalPropertiesModule {}
