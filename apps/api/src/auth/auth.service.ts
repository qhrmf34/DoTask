import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('이미 사용 중인 이메일입니다.');

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        nickname: dto.nickname,
        pomodoroSettings: { create: {} },
      },
    });

    return this.issueTokens(user.id, user.email, user.role);
  }

  async validateUser(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash) throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다.');
    if (!user.isActive) throw new UnauthorizedException('비활성화된 계정입니다.');
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다.');
    return user;
  }

  async login(userId: string, email: string, role: string) {
    return this.issueTokens(userId, email, role);
  }

  async refresh(userId: string, refreshToken: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();
    return this.issueTokens(user.id, user.email, user.role);
  }

  async refreshWithToken(refreshToken: string) {
    try {
      const payload = this.jwt.verify(refreshToken, {
        secret: (process.env.JWT_SECRET || '') + '_refresh',
      }) as { sub: string; email: string; role: string };
      const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
      if (!user) throw new UnauthorizedException();
      return this.issueTokens(user.id, user.email, user.role);
    } catch {
      throw new UnauthorizedException('유효하지 않은 리프레시 토큰입니다.');
    }
  }

  async logout(res: any) {
    res.clearCookie('refresh_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/auth/refresh',
    });
  }

  private async issueTokens(userId: string, email: string, role: string) {
    const payload = { sub: userId, email, role };
    const accessToken = this.jwt.sign(payload, {
      secret: process.env.JWT_SECRET,
      expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    });
    const refreshToken = this.jwt.sign(payload, {
      secret: process.env.JWT_SECRET + '_refresh',
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    });
    return { accessToken, refreshToken };
  }

  async findOrCreateOAuthUser(
    provider: string,
    providerId: string,
    email: string,
    nickname: string,
    profileImage?: string,
  ) {
    let user = await this.prisma.user.findFirst({ where: { providerId, provider } });
    if (!user) {
      user = await this.prisma.user.findUnique({ where: { email } });
    }
    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email,
          nickname,
          profileImage,
          provider,
          providerId,
          pomodoroSettings: { create: {} },
        },
      });
    }
    return user;
  }
}
