import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { JwtPayload } from '../strategies/types/jwt-payload.type.js';

/**
 * The signed-in user that JwtStrategy put on the request.
 * Only use it on routes protected by AuthGuard('jwt').
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): JwtPayload =>
    context.switchToHttp().getRequest<{ user: JwtPayload }>().user,
);
