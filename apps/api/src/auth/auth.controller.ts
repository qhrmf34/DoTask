import {
  Controller, Post, Get, Body, Req, Res, UseGuards, HttpCode, HttpStatus, BadRequestException,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { Public } from '../common/decorators/public.decorator';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Throttle({ short: { ttl: 60000, limit: 5 } })
  @Post('register')
  async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) res: any) {
    const { accessToken, refreshToken } = await this.authService.register(dto);
    this.setRefreshCookie(res, refreshToken);
    return { accessToken, refreshToken };
  }

  @Public()
  @Throttle({ short: { ttl: 60000, limit: 10 } })
  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Req() req: any, @Res({ passthrough: true }) res: any) {
    const { accessToken, refreshToken } = await this.authService.login(
      req.user.id,
      req.user.email,
      req.user.role,
    );
    this.setRefreshCookie(res, refreshToken);
    return { accessToken, refreshToken };
  }

  @Public()
  @Post('refresh-token')
  @HttpCode(HttpStatus.OK)
  async refreshWithToken(@Body('refreshToken') token: string) {
    if (!token) throw new BadRequestException('refreshToken이 필요합니다.');
    const { accessToken, refreshToken } = await this.authService.refreshWithToken(token);
    return { accessToken, refreshToken };
  }

  @Public()
  @UseGuards(JwtRefreshGuard)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Req() req: any, @Res({ passthrough: true }) res: any) {
    const { accessToken, refreshToken } = await this.authService.refresh(
      req.user.sub,
      req.cookies?.refresh_token,
    );
    this.setRefreshCookie(res, refreshToken);
    return { accessToken };
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Res({ passthrough: true }) res: any) {
    await this.authService.logout(res);
    return { message: '로그아웃 되었습니다.' };
  }

  private setRefreshCookie(res: any, token: string) {
    res.cookie('refresh_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });
  }
}
