import { Test, type TestingModule } from '@nestjs/testing'
import { Reflector } from '@nestjs/core'
import { type ExecutionContext, ForbiddenException, NotFoundException } from '@nestjs/common'
import { HouseholdGuard } from '../guards/household.guard'
import { ResourceOwnershipService } from '../services/resource-ownership.service'
import { ResourceType, type ResourceConfig } from '../interfaces/permission.interface'
import { RESOURCE_KEY } from '../decorators/resource-id.decorator'
import { PUBLIC_RESOURCE_KEY } from '../decorators/public-resource.decorator'
import { IS_PUBLIC_KEY } from '../../auth/decorators/public.decorator'

describe('HouseholdGuard', () => {
  let guard: HouseholdGuard
  let reflector: Reflector
  let resourceOwnershipService: ResourceOwnershipService

  const createMockContext = (user: unknown, params: Record<string, string>): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({ user, params }),
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    }) as unknown as ExecutionContext

  // The guard reads three reflection keys: IS_PUBLIC_KEY, PUBLIC_RESOURCE_KEY, RESOURCE_KEY.
  const stubReflector = (opts: {
    isPublic?: boolean
    isPublicResource?: boolean
    resourceConfig?: ResourceConfig
  }) => {
    jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key: unknown) => {
      if (key === IS_PUBLIC_KEY) return opts.isPublic ?? undefined
      if (key === PUBLIC_RESOURCE_KEY) return opts.isPublicResource ?? undefined
      if (key === RESOURCE_KEY) return opts.resourceConfig ?? undefined
      return undefined
    })
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HouseholdGuard,
        {
          provide: Reflector,
          useValue: { getAllAndOverride: jest.fn() },
        },
        {
          provide: ResourceOwnershipService,
          useValue: { getResourceHouseholdId: jest.fn() },
        },
      ],
    }).compile()

    guard = module.get<HouseholdGuard>(HouseholdGuard)
    reflector = module.get<Reflector>(Reflector)
    resourceOwnershipService = module.get<ResourceOwnershipService>(ResourceOwnershipService)
  })

  describe('fail-closed defaults', () => {
    it('throws when route has path params and no @ResourceId/@PublicResource', async () => {
      stubReflector({})
      const context = createMockContext({ householdId: 'h1' }, { id: 'asset1' })
      await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException)
      await expect(guard.canActivate(context)).rejects.toThrow(/Resource ownership not declared/)
    })

    it('allows access for collection-level routes (no path params, no resource config)', async () => {
      stubReflector({})
      const context = createMockContext({ householdId: 'h1' }, {})
      expect(await guard.canActivate(context)).toBe(true)
    })

    it('allows access when route is marked @PublicResource() even with path params', async () => {
      stubReflector({ isPublicResource: true })
      const context = createMockContext({ householdId: 'h1' }, { symbol: 'AAPL' })
      expect(await guard.canActivate(context)).toBe(true)
    })

    it('allows access when route is marked @Public() (auth bypass)', async () => {
      stubReflector({ isPublic: true })
      const context = createMockContext(null, { id: 'something' })
      expect(await guard.canActivate(context)).toBe(true)
    })
  })

  describe('when resource config is specified', () => {
    beforeEach(() => {
      stubReflector({ resourceConfig: { type: ResourceType.ASSET, idParam: 'id' } })
    })

    it('should allow access when resource belongs to user household', async () => {
      jest.spyOn(resourceOwnershipService, 'getResourceHouseholdId').mockResolvedValue('h1')
      const context = createMockContext({ householdId: 'h1' }, { id: 'asset1' })
      expect(await guard.canActivate(context)).toBe(true)
    })

    it('should throw NotFoundException when resource does not exist', async () => {
      jest.spyOn(resourceOwnershipService, 'getResourceHouseholdId').mockResolvedValue(null)
      const context = createMockContext({ householdId: 'h1' }, { id: 'nonexistent' })
      await expect(guard.canActivate(context)).rejects.toThrow(NotFoundException)
    })

    it('should throw NotFoundException when resource belongs to different household', async () => {
      jest.spyOn(resourceOwnershipService, 'getResourceHouseholdId').mockResolvedValue('h2')
      const context = createMockContext({ householdId: 'h1' }, { id: 'asset1' })
      await expect(guard.canActivate(context)).rejects.toThrow(NotFoundException)
    })

    it('should skip check when no resource ID in params (create endpoint)', async () => {
      const context = createMockContext({ householdId: 'h1' }, {})
      expect(await guard.canActivate(context)).toBe(true)
    })
  })

  describe('missing user data', () => {
    beforeEach(() => {
      stubReflector({ resourceConfig: { type: ResourceType.ASSET, idParam: 'id' } })
    })

    it('should throw ForbiddenException when user is missing', async () => {
      const context = createMockContext(null, { id: 'asset1' })
      await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException)
    })

    it('should throw ForbiddenException when householdId is missing', async () => {
      const context = createMockContext({ id: '1' }, { id: 'asset1' })
      await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException)
    })
  })

  describe('different resource types', () => {
    it('should check account resource through user', async () => {
      stubReflector({ resourceConfig: { type: ResourceType.ACCOUNT, idParam: 'accountId' } })
      jest.spyOn(resourceOwnershipService, 'getResourceHouseholdId').mockResolvedValue('h1')

      const context = createMockContext({ householdId: 'h1' }, { accountId: 'acc1' })
      expect(await guard.canActivate(context)).toBe(true)

      expect(resourceOwnershipService.getResourceHouseholdId).toHaveBeenCalledWith(
        ResourceType.ACCOUNT,
        'acc1',
      )
    })

    it('should check transaction resource through account->user', async () => {
      stubReflector({ resourceConfig: { type: ResourceType.TRANSACTION, idParam: 'txId' } })
      jest.spyOn(resourceOwnershipService, 'getResourceHouseholdId').mockResolvedValue('h1')

      const context = createMockContext({ householdId: 'h1' }, { txId: 'tx1' })
      expect(await guard.canActivate(context)).toBe(true)

      expect(resourceOwnershipService.getResourceHouseholdId).toHaveBeenCalledWith(
        ResourceType.TRANSACTION,
        'tx1',
      )
    })

    it('should check notification resource through user', async () => {
      stubReflector({ resourceConfig: { type: ResourceType.NOTIFICATION, idParam: 'id' } })
      jest.spyOn(resourceOwnershipService, 'getResourceHouseholdId').mockResolvedValue('h1')

      const context = createMockContext({ householdId: 'h1' }, { id: 'notif1' })
      expect(await guard.canActivate(context)).toBe(true)

      expect(resourceOwnershipService.getResourceHouseholdId).toHaveBeenCalledWith(
        ResourceType.NOTIFICATION,
        'notif1',
      )
    })

    it('should check plaid_item resource directly by household', async () => {
      stubReflector({ resourceConfig: { type: ResourceType.PLAID_ITEM, idParam: 'id' } })
      jest.spyOn(resourceOwnershipService, 'getResourceHouseholdId').mockResolvedValue('h1')

      const context = createMockContext({ householdId: 'h1' }, { id: 'item1' })
      expect(await guard.canActivate(context)).toBe(true)

      expect(resourceOwnershipService.getResourceHouseholdId).toHaveBeenCalledWith(
        ResourceType.PLAID_ITEM,
        'item1',
      )
    })

    it('should check scenario resource directly by household', async () => {
      stubReflector({ resourceConfig: { type: ResourceType.SCENARIO, idParam: 'id' } })
      jest.spyOn(resourceOwnershipService, 'getResourceHouseholdId').mockResolvedValue('h2')

      const context = createMockContext({ householdId: 'h1' }, { id: 'scn1' })
      // Cross-household: foreign scenario must surface as NotFound, not Forbidden
      // (avoids existence disclosure).
      await expect(guard.canActivate(context)).rejects.toThrow(NotFoundException)
    })
  })
})
