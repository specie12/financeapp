import { Test, type TestingModule } from '@nestjs/testing'
import { Reflector } from '@nestjs/core'
import { type ExecutionContext, ForbiddenException } from '@nestjs/common'
import { PermissionGuard } from '../guards/permission.guard'
import { Permission, HouseholdRole } from '../interfaces/permission.interface'
import { PERMISSION_KEY } from '../decorators/require-permission.decorator'
import { IS_PUBLIC_KEY } from '../../auth/decorators/public.decorator'

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

  // Helper that sets up the reflector to return whatever metadata is configured.
  // The guard reads two keys: IS_PUBLIC_KEY then PERMISSION_KEY.
  const stubReflector = (opts: { isPublic?: boolean; permission?: Permission }) => {
    jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key: unknown) => {
      if (key === IS_PUBLIC_KEY) return opts.isPublic ?? undefined
      if (key === PERMISSION_KEY) return opts.permission ?? undefined
      return undefined
    })
  }

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

  describe('fail-closed defaults', () => {
    it('throws ForbiddenException when no permission is declared and route is not public', () => {
      stubReflector({})
      const context = createMockContext({ id: '1', role: HouseholdRole.OWNER })
      expect(() => guard.canActivate(context)).toThrow(ForbiddenException)
      expect(() => guard.canActivate(context)).toThrow(/Permission not declared/)
    })

    it('allows access when route is marked @Public()', () => {
      stubReflector({ isPublic: true })
      const context = createMockContext(null)
      expect(guard.canActivate(context)).toBe(true)
    })

    it('allows access when @Public() is set even if a permission is also declared', () => {
      stubReflector({ isPublic: true, permission: Permission.READ })
      const context = createMockContext(null)
      expect(guard.canActivate(context)).toBe(true)
    })
  })

  describe('owner role', () => {
    const ownerUser = { id: '1', role: HouseholdRole.OWNER }

    it('should allow CREATE', () => {
      stubReflector({ permission: Permission.CREATE })
      expect(guard.canActivate(createMockContext(ownerUser))).toBe(true)
    })

    it('should allow READ', () => {
      stubReflector({ permission: Permission.READ })
      expect(guard.canActivate(createMockContext(ownerUser))).toBe(true)
    })

    it('should allow UPDATE', () => {
      stubReflector({ permission: Permission.UPDATE })
      expect(guard.canActivate(createMockContext(ownerUser))).toBe(true)
    })

    it('should allow DELETE', () => {
      stubReflector({ permission: Permission.DELETE })
      expect(guard.canActivate(createMockContext(ownerUser))).toBe(true)
    })
  })

  describe('editor role', () => {
    const editorUser = { id: '1', role: HouseholdRole.EDITOR }

    it('should allow CREATE', () => {
      stubReflector({ permission: Permission.CREATE })
      expect(guard.canActivate(createMockContext(editorUser))).toBe(true)
    })

    it('should allow READ', () => {
      stubReflector({ permission: Permission.READ })
      expect(guard.canActivate(createMockContext(editorUser))).toBe(true)
    })

    it('should allow UPDATE', () => {
      stubReflector({ permission: Permission.UPDATE })
      expect(guard.canActivate(createMockContext(editorUser))).toBe(true)
    })

    it('should deny DELETE', () => {
      stubReflector({ permission: Permission.DELETE })
      expect(() => guard.canActivate(createMockContext(editorUser))).toThrow(ForbiddenException)
    })
  })

  describe('viewer role', () => {
    const viewerUser = { id: '1', role: HouseholdRole.VIEWER }

    it('should allow READ', () => {
      stubReflector({ permission: Permission.READ })
      expect(guard.canActivate(createMockContext(viewerUser))).toBe(true)
    })

    it('should deny CREATE', () => {
      stubReflector({ permission: Permission.CREATE })
      expect(() => guard.canActivate(createMockContext(viewerUser))).toThrow(ForbiddenException)
    })

    it('should deny UPDATE', () => {
      stubReflector({ permission: Permission.UPDATE })
      expect(() => guard.canActivate(createMockContext(viewerUser))).toThrow(ForbiddenException)
    })

    it('should deny DELETE', () => {
      stubReflector({ permission: Permission.DELETE })
      expect(() => guard.canActivate(createMockContext(viewerUser))).toThrow(ForbiddenException)
    })
  })

  describe('missing user data', () => {
    it('should throw ForbiddenException when user is missing', () => {
      stubReflector({ permission: Permission.READ })
      expect(() => guard.canActivate(createMockContext(null))).toThrow(ForbiddenException)
    })

    it('should throw ForbiddenException when role is missing', () => {
      stubReflector({ permission: Permission.READ })
      expect(() => guard.canActivate(createMockContext({ id: '1' }))).toThrow(ForbiddenException)
    })
  })
})
