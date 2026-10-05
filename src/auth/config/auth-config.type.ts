import type { JwtSignOptions } from '@nestjs/jwt';

export type AuthConfig = {
  secret: string;
  /** Same type the JWT library accepts, e.g. "15m" or "7d". */
  expiresIn: NonNullable<JwtSignOptions['expiresIn']>;
};
