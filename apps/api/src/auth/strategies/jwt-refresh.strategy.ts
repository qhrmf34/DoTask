import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => req?.cookies?.refresh_token,
      ]),
      ignoreExpiration: false,
      secretOrKey: (process.env.JWT_SECRET || '') + '_refresh',
      passReqToCallback: true,
    });
  }

  validate(req: Request, payload: any) {
    return { sub: payload.sub, email: payload.email, role: payload.role };
  }
}
