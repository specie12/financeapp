import {
  Injectable,
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { RESOURCE_KEY } from '../decorators/resource-id.decorator'
import { PUBLIC_RESOURCE_KEY } from '../decorators/public-resource.decorator'
import { IS_PUBLIC_KEY } from '../../auth/decorators/public.decorator'
import { type ResourceConfig } from '../interfaces/permission.interface'
import { ResourceOwnershipService } from '../services/resource-ownership.service'

@Injectable()
export class HouseholdGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly resourceOwnershipService: ResourceOwnershipService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ])
    if (isPublic) return true

    const isPublicResource = this.reflector.getAllAndOverride<boolean>(PUBLIC_RESOURCE_KEY, [
      context.getHandler(),
      context.getClass(),
    ])
    if (isPublicResource) return true

    const resourceConfig = this.reflector.getAllAndOverride<ResourceConfig>(RESOURCE_KEY, [
      context.getHandler(),
      context.getClass(),
    ])

    const request = context.switchToHttp().getRequest()
    const params: Record<string, string> = request.params ?? {}
    const hasPathParams = Object.keys(params).length > 0

    // Fail closed: a route with path params must declare either @ResourceId
    // (ownership-checked) or @PublicResource (explicit opt-out).
    if (hasPathParams && !resourceConfig) {
      throw new ForbiddenException(
        'Resource ownership not declared for this route. ' +
          'Add @ResourceId({ type, idParam }) for ownership-checked resources, ' +
          'or @PublicResource() to opt out explicitly.',
      )
    }

    if (!resourceConfig) {
      // Collection-level route (no path params). Household scoping is the
      // responsibility of the service layer via @CurrentUser('householdId').
      return true
    }

    const user = request.user

    if (!user || !user.householdId) {
      throw new ForbiddenException('User household not found')
    }

    const resourceId = params[resourceConfig.idParam]

    if (!resourceId) {
      // Path declared via @ResourceId but no ID supplied (e.g. POST without :id).
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
