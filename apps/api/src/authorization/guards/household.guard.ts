import {
  Injectable,
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common'
import { type Reflector } from '@nestjs/core'
import { RESOURCE_KEY } from '../decorators/resource-id.decorator'
import { type ResourceConfig } from '../interfaces/permission.interface'
import { type ResourceOwnershipService } from '../services/resource-ownership.service'

@Injectable()
export class HouseholdGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly resourceOwnershipService: ResourceOwnershipService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const resourceConfig = this.reflector.getAllAndOverride<ResourceConfig>(RESOURCE_KEY, [
      context.getHandler(),
      context.getClass(),
    ])

    if (!resourceConfig) {
      return true
    }

    const request = context.switchToHttp().getRequest()
    const user = request.user

    if (!user || !user.householdId) {
      throw new ForbiddenException('User household not found')
    }

    const resourceId = request.params[resourceConfig.idParam]

    if (!resourceId) {
      return true
    }

    const resourceHouseholdId = await this.resourceOwnershipService.getResourceHouseholdId(
      resourceConfig.type,
      resourceId,
    )

    if (resourceHouseholdId === null) {
      throw new NotFoundException(`${resourceConfig.type} not found`)
    }

    if (resourceHouseholdId !== user.householdId) {
      throw new NotFoundException(`${resourceConfig.type} not found`)
    }

    return true
  }
}
