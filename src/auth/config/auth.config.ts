import { registerAs } from '@nestjs/config';
import { IsOptional, IsString, Matches, MinLength } from 'class-validator';
import { validateConfig } from '../../utils/validate-config.js';
import type { AuthConfig } from './auth-config.type.js';

const DEVELOPMENT_SECRET = 'development-secret';

/** Secrets that are public (in code or .env.example) and must never be used in production. */
const PLACEHOLDER_SECRETS = [DEVELOPMENT_SECRET, 'replace-this-in-development'];

class EnvironmentVariablesValidator {
  @IsOptional()
  @IsString()
  @MinLength(16)
  JWT_SECRET?: string;

  /** A number plus a unit, e.g. "15m", "12h", "7d". */
  @IsOptional()
  @Matches(/^\d+(ms|s|m|h|d|w|y)$/)
  JWT_EXPIRES_IN?: string;
}

export default registerAs<AuthConfig>('auth', () => {
  const env = validateConfig(process.env, EnvironmentVariablesValidator);

  if (
    process.env.NODE_ENV === 'production' &&
    (!env.JWT_SECRET || PLACEHOLDER_SECRETS.includes(env.JWT_SECRET))
  ) {
    throw new Error('JWT_SECRET must be set to a private value in production');
  }

  return {
    secret: env.JWT_SECRET ?? DEVELOPMENT_SECRET,
    // Safe: the @Matches pattern above only lets through values like "7d".
    expiresIn: (env.JWT_EXPIRES_IN ?? '7d') as AuthConfig['expiresIn'],
  };
});
