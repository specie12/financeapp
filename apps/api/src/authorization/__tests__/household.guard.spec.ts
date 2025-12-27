import { Test, type TestingModule } from '@nestjs/testing'
import { Reflector } from '@nestjs/core'
import { type ExecutionContext, ForbiddenException, NotFoundException } from '@nestjs/common'
import { HouseholdGuard } from '../guards/household.guard'
import { ResourceOwnershipService } from '../services/resource-ownership.service'
import { ResourceType } from '../interfaces/permission.interface'

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

  describe('when no resource config is specified', () => {
    it('should allow access', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined)
      const context = createMockContext({ householdId: 'h1' }, {})
      expect(await guard.canActivate(context)).toBe(true)
    })
  })

  describe('when resource config is specified', () => {
    beforeEach(() => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue({
        type: ResourceType.ASSET,
        idParam: 'id',
      })
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
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue({
        type: ResourceType.ASSET,
        idParam: 'id',
      })
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
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue({
        type: ResourceType.ACCOUNT,
        idParam: 'accountId',
      })
      jest.spyOn(resourceOwnershipService, 'getResourceHouseholdId').mockResolvedValue('h1')

      const context = createMockContext({ householdId: 'h1' }, { accountId: 'acc1' })
      expect(await guard.canActivate(context)).toBe(true)

      expect(resourceOwnershipService.getResourceHouseholdId).toHaveBeenCalledWith(
        ResourceType.ACCOUNT,
        'acc1',
      )
    })

    it('should check transaction resource through account->user', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue({
        type: ResourceType.TRANSACTION,
        idParam: 'txId',
      })
      jest.spyOn(resourceOwnershipService, 'getResourceHouseholdId').mockResolvedValue('h1')

      const context = createMockContext({ householdId: 'h1' }, { txId: 'tx1' })
      expect(await guard.canActivate(context)).toBe(true)

      expect(resourceOwnershipService.getResourceHouseholdId).toHaveBeenCalledWith(
        ResourceType.TRANSACTION,
        'tx1',
      )
    })
  })
})
