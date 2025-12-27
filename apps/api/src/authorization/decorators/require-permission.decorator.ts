import { SetMetadata } from '@nestjs/common'
import { type Permission } from '../interfaces/permission.interface'

export const PERMISSION_KEY = 'required_permission'

export const RequirePermission = (permission: Permission) => SetMetadata(PERMISSION_KEY, permission)
