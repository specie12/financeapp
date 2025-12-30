import { Injectable, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy, type StrategyOptionsWithRequest } from 'passport-jwt'
import { PrismaService } from '../../prisma/prisma.service'
import { type JwtRefreshPayload } from '../interfaces/jwt-payload.interface'

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(
    configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const options: StrategyOptionsWithRequest = {
      jwtFromRequest: ExtractJwt.fromBodyField('refreshToken'),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.refreshSecret') || 'fallback-secret',
      passReqToCallback: true,
    }
    super(options)
  }

  async validate(_req: unknown, payload: JwtRefreshPayload) {
    if (payload.type !== 'refresh') {
      throw new UnauthorizedException('Invalid token type')
    }

    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { id: payload.tokenId },
      include: { user: true },
    })

    if (!storedToken) {
      throw new UnauthorizedException('Refresh token not found')
    }

    if (storedToken.isRevoked) {
      await this.prisma.refreshToken.updateMany({
        where: { userId: storedToken.userId },
        data: { isRevoked: true, revokedAt: new Date() },
      })
      throw new UnauthorizedException('Refresh token has been revoked')
    }

    if (storedToken.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token has expired')
    }

    return {
      user: storedToken.user,
      tokenId: payload.tokenId,
    }
  }
}
