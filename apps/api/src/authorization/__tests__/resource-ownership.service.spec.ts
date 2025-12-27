import { Test, type TestingModule } from '@nestjs/testing'
import { ResourceOwnershipService } from '../services/resource-ownership.service'
import { PrismaService } from '../../prisma/prisma.service'
import { ResourceType } from '../interfaces/permission.interface'

describe('ResourceOwnershipService', () => {
  let service: ResourceOwnershipService

  const mockPrisma = {
    asset: { findUnique: jest.fn() },
    liability: { findUnique: jest.fn() },
    cashFlowItem: { findUnique: jest.fn() },
    scenario: { findUnique: jest.fn() },
    scenarioOverride: { findUnique: jest.fn() },
    account: { findUnique: jest.fn() },
    category: { findUnique: jest.fn() },
    budget: { findUnique: jest.fn() },
    transaction: { findUnique: jest.fn() },
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ResourceOwnershipService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile()

    service = module.get<ResourceOwnershipService>(ResourceOwnershipService)

    jest.clearAllMocks()
  })

  describe('direct household resources', () => {
    it('should get householdId for asset', async () => {
      mockPrisma.asset.findUnique.mockResolvedValue({ householdId: 'h1' })

      const result = await service.getResourceHouseholdId(ResourceType.ASSET, 'asset1')

      expect(result).toBe('h1')
      expect(mockPrisma.asset.findUnique).toHaveBeenCalledWith({
        where: { id: 'asset1' },
        select: { householdId: true },
      })
    })

    it('should return null for non-existent asset', async () => {
      mockPrisma.asset.findUnique.mockResolvedValue(null)

      const result = await service.getResourceHouseholdId(ResourceType.ASSET, 'nonexistent')

      expect(result).toBeNull()
    })

    it('should get householdId for liability', async () => {
      mockPrisma.liability.findUnique.mockResolvedValue({ householdId: 'h1' })

      const result = await service.getResourceHouseholdId(ResourceType.LIABILITY, 'liability1')

      expect(result).toBe('h1')
    })

    it('should get householdId for cashFlowItem', async () => {
      mockPrisma.cashFlowItem.findUnique.mockResolvedValue({ householdId: 'h1' })

      const result = await service.getResourceHouseholdId(ResourceType.CASH_FLOW_ITEM, 'cfi1')

      expect(result).toBe('h1')
    })

    it('should get householdId for scenario', async () => {
      mockPrisma.scenario.findUnique.mockResolvedValue({ householdId: 'h1' })

      const result = await service.getResourceHouseholdId(ResourceType.SCENARIO, 'scenario1')

      expect(result).toBe('h1')
    })
  })

  describe('user-owned resources', () => {
    it('should get householdId for account through user', async () => {
      mockPrisma.account.findUnique.mockResolvedValue({ user: { householdId: 'h1' } })

      const result = await service.getResourceHouseholdId(ResourceType.ACCOUNT, 'acc1')

      expect(result).toBe('h1')
      expect(mockPrisma.account.findUnique).toHaveBeenCalledWith({
        where: { id: 'acc1' },
        select: { user: { select: { householdId: true } } },
      })
    })

    it('should return null for non-existent account', async () => {
      mockPrisma.account.findUnique.mockResolvedValue(null)

      const result = await service.getResourceHouseholdId(ResourceType.ACCOUNT, 'nonexistent')

      expect(result).toBeNull()
    })

    it('should get householdId for category through user', async () => {
      mockPrisma.category.findUnique.mockResolvedValue({ user: { householdId: 'h1' } })

      const result = await service.getResourceHouseholdId(ResourceType.CATEGORY, 'cat1')

      expect(result).toBe('h1')
    })

    it('should get householdId for budget through user', async () => {
      mockPrisma.budget.findUnique.mockResolvedValue({ user: { householdId: 'h1' } })

      const result = await service.getResourceHouseholdId(ResourceType.BUDGET, 'budget1')

      expect(result).toBe('h1')
    })
  })

  describe('nested resources', () => {
    it('should get householdId for transaction through account->user', async () => {
      mockPrisma.transaction.findUnique.mockResolvedValue({
        account: { user: { householdId: 'h1' } },
      })

      const result = await service.getResourceHouseholdId(ResourceType.TRANSACTION, 'tx1')

      expect(result).toBe('h1')
      expect(mockPrisma.transaction.findUnique).toHaveBeenCalledWith({
        where: { id: 'tx1' },
        select: { account: { select: { user: { select: { householdId: true } } } } },
      })
    })

    it('should get householdId for scenarioOverride through scenario', async () => {
      mockPrisma.scenarioOverride.findUnique.mockResolvedValue({
        scenario: { householdId: 'h1' },
      })

      const result = await service.getResourceHouseholdId(ResourceType.SCENARIO_OVERRIDE, 'so1')

      expect(result).toBe('h1')
      expect(mockPrisma.scenarioOverride.findUnique).toHaveBeenCalledWith({
        where: { id: 'so1' },
        select: { scenario: { select: { householdId: true } } },
      })
    })
  })

  describe('error handling', () => {
    it('should throw error for unknown resource type', async () => {
      await expect(
        service.getResourceHouseholdId('unknown' as ResourceType, 'id1'),
      ).rejects.toThrow('Unknown resource type: unknown')
    })
  })
})
