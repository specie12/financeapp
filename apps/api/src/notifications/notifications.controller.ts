import { Controller, Get, Patch, Delete, Param, Query } from '@nestjs/common'
import { NotificationsService } from './notifications.service'
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe'
import { notificationQuerySchema } from '@finance-app/validation'
import { RequirePermission } from '../authorization/decorators/require-permission.decorator'
import { Permission } from '../authorization/interfaces/permission.interface'
import { CurrentUser } from '../auth/decorators/current-user.decorator'
import type { NotificationQueryDto } from './dto/notification-query.dto'
import type {
  ApiResponse,
  PaginatedResponse,
  Notification,
  UnreadCountResponse,
} from '@finance-app/shared-types'

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @RequirePermission(Permission.READ)
  async findAll(
    @CurrentUser('id') userId: string,
    @Query(new ZodValidationPipe(notificationQuerySchema)) query: NotificationQueryDto,
  ): Promise<PaginatedResponse<Notification>> {
    const result = await this.notificationsService.findAll(userId, query)
    return {
      success: true,
      data: result.data as unknown as Notification[],
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / result.limit),
      },
    }
  }

  @Get('unread-count')
  @RequirePermission(Permission.READ)
  async getUnreadCount(
    @CurrentUser('id') userId: string,
  ): Promise<ApiResponse<UnreadCountResponse>> {
    const count = await this.notificationsService.getUnreadCount(userId)
    return {
      success: true,
      data: { count },
    }
  }

  @Patch(':id/read')
  @RequirePermission(Permission.UPDATE)
  async markRead(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ): Promise<ApiResponse<Notification>> {
    const notification = await this.notificationsService.markRead(id, userId)
    return {
      success: true,
      data: notification as unknown as Notification,
    }
  }

  @Patch('read-all')
  @RequirePermission(Permission.UPDATE)
  async markAllRead(@CurrentUser('id') userId: string): Promise<ApiResponse<{ updated: number }>> {
    const updated = await this.notificationsService.markAllRead(userId)
    return {
      success: true,
      data: { updated },
    }
  }

  @Delete(':id')
  @RequirePermission(Permission.DELETE)
  async remove(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ): Promise<ApiResponse<{ deleted: boolean }>> {
    await this.notificationsService.remove(id, userId)
    return {
      success: true,
      data: { deleted: true },
    }
  }
}
