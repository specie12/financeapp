import {
  Injectable,
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { PERMISSION_KEY } from '../decorators/require-permission.decorator'
import {
  type Permission,
  type HouseholdRole,
  ROLE_PERMISSIONS,
} from '../interfaces/permission.interface'

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermission = this.reflector.getAllAndOverride<Permission>(PERMISSION_KEY, [
      context.getHandler(),
      context.getClass(),
    ])

    if (!requiredPermission) {
      return true
    }

    const request = context.switchToHttp().getRequest()
    const user = request.user

    if (!user || !user.role) {
      throw new ForbiddenException('User role not found')
    }

    const userRole = user.role as HouseholdRole
    const allowedPermissions = ROLE_PERMISSIONS[userRole]

    if (!allowedPermissions?.includes(requiredPermission)) {
      throw new ForbiddenException(
        `Insufficient permissions. Required: ${requiredPermission}, Your role: ${userRole}`,
      )
    }

    return true
  }
}
