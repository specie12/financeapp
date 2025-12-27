import { Global, Module } from '@nestjs/common'
import { ResourceOwnershipService } from './services/resource-ownership.service'
import { HouseholdGuard } from './guards/household.guard'
import { PermissionGuard } from './guards/permission.guard'

@Global()
@Module({
  providers: [ResourceOwnershipService, HouseholdGuard, PermissionGuard],
  exports: [ResourceOwnershipService, HouseholdGuard, PermissionGuard],
})
export class AuthorizationModule {}
