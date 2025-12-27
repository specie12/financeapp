import { Test, type TestingModule } from '@nestjs/testing'
import { Reflector } from '@nestjs/core'
import { type ExecutionContext, ForbiddenException } from '@nestjs/common'
import { PermissionGuard } from '../guards/permission.guard'
import { Permission, HouseholdRole } from '../interfaces/permission.interface'

describe('PermissionGuard', () => {
  let guard: PermissionGuard
  let reflector: Reflector

  const createMockContext = (user: unknown): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    }) as unknown as ExecutionContext

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PermissionGuard,
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn(),
          },
        },
      ],
    }).compile()

    guard = module.get<PermissionGuard>(PermissionGuard)
    reflector = module.get<Reflector>(Reflector)
  })

  describe('when no permission is required', () => {
    it('should allow access', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined)
      const context = createMockContext({ id: '1', role: HouseholdRole.VIEWER })
      expect(guard.canActivate(context)).toBe(true)
    })
  })

  describe('owner role', () => {
    const ownerUser = { id: '1', role: HouseholdRole.OWNER }

    it('should allow CREATE', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(Permission.CREATE)
      expect(guard.canActivate(createMockContext(ownerUser))).toBe(true)
    })

    it('should allow READ', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(Permission.READ)
      expect(guard.canActivate(createMockContext(ownerUser))).toBe(true)
    })

    it('should allow UPDATE', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(Permission.UPDATE)
      expect(guard.canActivate(createMockContext(ownerUser))).toBe(true)
    })

    it('should allow DELETE', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(Permission.DELETE)
      expect(guard.canActivate(createMockContext(ownerUser))).toBe(true)
    })
  })

  describe('editor role', () => {
    const editorUser = { id: '1', role: HouseholdRole.EDITOR }

    it('should allow CREATE', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(Permission.CREATE)
      expect(guard.canActivate(createMockContext(editorUser))).toBe(true)
    })

    it('should allow READ', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(Permission.READ)
      expect(guard.canActivate(createMockContext(editorUser))).toBe(true)
    })

    it('should allow UPDATE', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(Permission.UPDATE)
      expect(guard.canActivate(createMockContext(editorUser))).toBe(true)
    })

    it('should deny DELETE', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(Permission.DELETE)
      expect(() => guard.canActivate(createMockContext(editorUser))).toThrow(ForbiddenException)
    })
  })

  describe('viewer role', () => {
    const viewerUser = { id: '1', role: HouseholdRole.VIEWER }

    it('should allow READ', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(Permission.READ)
      expect(guard.canActivate(createMockContext(viewerUser))).toBe(true)
    })

    it('should deny CREATE', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(Permission.CREATE)
      expect(() => guard.canActivate(createMockContext(viewerUser))).toThrow(ForbiddenException)
    })

    it('should deny UPDATE', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(Permission.UPDATE)
      expect(() => guard.canActivate(createMockContext(viewerUser))).toThrow(ForbiddenException)
    })

    it('should deny DELETE', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(Permission.DELETE)
      expect(() => guard.canActivate(createMockContext(viewerUser))).toThrow(ForbiddenException)
    })
  })

  describe('missing user data', () => {
    it('should throw ForbiddenException when user is missing', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(Permission.READ)
      expect(() => guard.canActivate(createMockContext(null))).toThrow(ForbiddenException)
    })

    it('should throw ForbiddenException when role is missing', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(Permission.READ)
      expect(() => guard.canActivate(createMockContext({ id: '1' }))).toThrow(ForbiddenException)
    })
  })
})
