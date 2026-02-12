import { Module } from '@nestjs/common'
import { NotificationsController } from './notifications.controller'
import { NotificationsService } from './notifications.service'
import { NotificationTriggersService } from './notification-triggers.service'

@Module({
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationTriggersService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
