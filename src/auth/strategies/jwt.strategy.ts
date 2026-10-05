import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { AllConfigType } from '../../config/config.type.js';
import type { JwtPayload } from './types/jwt-payload.type.js';

/** Used by AuthGuard('jwt'): reads the Bearer token, checks its signature and expiry, and sets request.user. */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(configService: ConfigService<AllConfigType>) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.getOrThrow('auth.secret', { infer: true }),
    });
  }

  /** Runs after the token is verified; whatever it returns becomes request.user. */
  validate(payload: JwtPayload): JwtPayload {
    if (!payload.id) throw new UnauthorizedException();
    return payload;
  }
}
