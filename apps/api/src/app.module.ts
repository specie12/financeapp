import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { APP_GUARD } from '@nestjs/core'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { PrismaModule } from './prisma/prisma.module'
import { AuthModule } from './auth/auth.module'
import { AuthorizationModule } from './authorization/authorization.module'
import { PlanLimitsModule } from './plan-limits/plan-limits.module'
import { AssetsModule } from './assets/assets.module'
import { LiabilitiesModule } from './liabilities/liabilities.module'
import { CashFlowItemsModule } from './cash-flow-items/cash-flow-items.module'
import { DashboardModule } from './dashboard/dashboard.module'
import { ScenariosModule } from './scenarios/scenarios.module'
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard'
import { PermissionGuard } from './authorization/guards/permission.guard'
import { HouseholdGuard } from './authorization/guards/household.guard'
import configuration from './config/configuration'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    PrismaModule,
    AuthModule,
    AuthorizationModule,
    PlanLimitsModule,
    AssetsModule,
    LiabilitiesModule,
    CashFlowItemsModule,
    DashboardModule,
    ScenariosModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Guards execute in registration order:
    // 1. JwtAuthGuard - Authentication (validates JWT, attaches user)
    // 2. PermissionGuard - Role-based permission check
    // 3. HouseholdGuard - Resource ownership verification
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: PermissionGuard,
    },
    {
      provide: APP_GUARD,
      useClass: HouseholdGuard,
    },
  ],
})
export class AppModule {}
