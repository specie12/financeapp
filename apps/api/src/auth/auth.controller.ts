import { Controller, Post, Get, Body, UseGuards, HttpCode, HttpStatus, Req } from '@nestjs/common'
import { type Request } from 'express'
import { AuthService } from './auth.service'
import { type LoginDto } from './dto/login.dto'
import { type RegisterDto } from './dto/register.dto'
import { type RefreshTokenDto } from './dto/refresh-token.dto'
import { JwtAuthGuard } from './guards/jwt-auth.guard'
import { JwtRefreshGuard } from './guards/jwt-refresh.guard'
import { CurrentUser } from './decorators/current-user.decorator'
import { Public } from './decorators/public.decorator'
import { type AuthTokens, type AuthUser, type ApiResponse } from '@finance-app/shared-types'

interface RefreshRequest extends Request {
  user: { user: { id: string }; tokenId: string }
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  async register(@Body() dto: RegisterDto): Promise<ApiResponse<AuthUser>> {
    const user = await this.authService.register(dto)
    return {
      success: true,
      data: user,
      message: 'Registration successful',
    }
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto, @Req() req: Request): Promise<ApiResponse<AuthTokens>> {
    const userAgent = req.headers['user-agent']
    const ipAddress = req.ip || req.socket.remoteAddress

    const tokens = await this.authService.login(dto, userAgent, ipAddress)
    return {
      success: true,
      data: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: tokens.expiresIn,
      },
    }
  }

  @Public()
  @UseGuards(JwtRefreshGuard)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Body() _dto: RefreshTokenDto,
    @Req() req: RefreshRequest,
  ): Promise<ApiResponse<AuthTokens>> {
    const { user, tokenId } = req.user
    const userAgent = req.headers['user-agent']
    const ipAddress = req.ip || req.socket.remoteAddress

    const tokens = await this.authService.refreshTokens(user.id, tokenId, userAgent, ipAddress)

    return {
      success: true,
      data: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: tokens.expiresIn,
      },
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@CurrentUser('id') userId: string): Promise<{ success: boolean; message: string }> {
    await this.authService.logout(userId)
    return {
      success: true,
      message: 'Logged out successfully',
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@CurrentUser('id') userId: string): Promise<ApiResponse<AuthUser>> {
    const user = await this.authService.getMe(userId)
    return {
      success: true,
      data: user,
    }
  }
}
