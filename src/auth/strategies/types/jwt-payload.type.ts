import type { Role } from '@prisma/client';

/** What AuthService puts inside every access token. */
export type JwtPayload = {
  id: string;
  email: string;
  role: Role;
  iat?: number;
  exp?: number;
};
