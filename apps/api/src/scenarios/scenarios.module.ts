import { Module } from '@nestjs/common'
import { ScenariosController } from './scenarios.controller'
import { ScenariosService } from './scenarios.service'
import { PrismaModule } from '../prisma/prisma.module'

@Module({
  imports: [PrismaModule],
  controllers: [ScenariosController],
  providers: [ScenariosService],
  exports: [ScenariosService],
})
export class ScenariosModule {}
