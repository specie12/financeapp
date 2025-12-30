import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import * as bcrypt from 'bcrypt'
import { PrismaService } from '../prisma/prisma.service'
import { type RegisterDto } from './dto/register.dto'
import { type LoginDto } from './dto/login.dto'
import { type JwtPayload, type JwtRefreshPayload } from './interfaces/jwt-payload.interface'
import type { User } from '@prisma/client'

export interface TokenResponse {
  accessToken: string
  refreshToken: string
  expiresIn: number
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    })

    if (existingUser) {
      throw new ConflictException('Email already registered')
    }

    const saltRounds = this.configService.get<number>('bcrypt.saltRounds') || 12
    const passwordHash = await bcrypt.hash(dto.password, saltRounds)

    const user = await this.prisma.$transaction(async (tx) => {
      const household = await tx.household.create({
        data: {
          name: `${dto.firstName}'s Household`,
        },
      })

      return tx.user.create({
        data: {
          email: dto.email,
          passwordHash,
          firstName: dto.firstName,
          lastName: dto.lastName,
          householdId: household.id,
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      })
    })

    return user
  }

  async login(dto: LoginDto, userAgent?: string, ipAddress?: string): Promise<TokenResponse> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    })

    if (!user) {
      throw new UnauthorizedException('Invalid credentials')
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash)

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials')
    }

    return this.generateTokens(user, userAgent, ipAddress)
  }

  async refreshTokens(
    userId: string,
    tokenId: string,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<TokenResponse> {
    await this.prisma.refreshToken.update({
      where: { id: tokenId },
      data: { isRevoked: true, revokedAt: new Date() },
    })

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      throw new UnauthorizedException('User not found')
    }

    return this.generateTokens(user, userAgent, ipAddress)
  }

  async logout(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, isRevoked: false },
      data: { isRevoked: true, revokedAt: new Date() },
    })
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
      },
    })

    if (!user) {
      throw new UnauthorizedException('User not found')
    }

    return user
  }

  private async generateTokens(
    user: User,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<TokenResponse> {
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    const refreshTokenRecord = await this.prisma.refreshToken.create({
      data: {
        token: '',
        userId: user.id,
        expiresAt,
        userAgent,
        ipAddress,
      },
    })

    const accessPayload: JwtPayload = {
      sub: user.id,
      email: user.email,
      type: 'access',
    }

    const accessToken = this.jwtService.sign(
      accessPayload as object,
      {
        secret: this.configService.get<string>('jwt.accessSecret'),
        expiresIn: this.configService.get<string>('jwt.accessExpiresIn') ?? '15m',
      } as any,
    )

    const refreshPayload: JwtRefreshPayload = {
      sub: user.id,
      email: user.email,
      type: 'refresh',
      tokenId: refreshTokenRecord.id,
    }

    const refreshToken = this.jwtService.sign(
      refreshPayload as object,
      {
        secret: this.configService.get<string>('jwt.refreshSecret'),
        expiresIn: this.configService.get<string>('jwt.refreshExpiresIn') ?? '7d',
      } as any,
    )

    await this.prisma.refreshToken.update({
      where: { id: refreshTokenRecord.id },
      data: { token: refreshToken },
    })

    return {
      accessToken,
      refreshToken,
      expiresIn: 900,
    }
  }

  async cleanupExpiredTokens(): Promise<number> {
    const result = await this.prisma.refreshToken.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: new Date() } },
          { isRevoked: true, revokedAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
        ],
      },
    })
    return result.count
  }
}
