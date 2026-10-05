import { registerAs } from '@nestjs/config';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsPositive,
  IsUrl,
  Max,
  Min,
} from 'class-validator';
import { validateConfig } from '../utils/validate-config.js';
import type { AppConfig } from './app-config.type.js';

enum Environment {
  Development = 'development',
  Test = 'test',
  Production = 'production',
}

class EnvironmentVariablesValidator {
  @IsOptional()
  @IsEnum(Environment)
  NODE_ENV?: Environment;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(65535)
  PORT?: number;

  @IsOptional()
  @IsUrl({ require_tld: false, require_protocol: true })
  FRONTEND_URL?: string;

  @IsOptional()
  @IsInt()
  @IsPositive()
  RATE_LIMIT_TTL_MS?: number;

  @IsOptional()
  @IsInt()
  @IsPositive()
  RATE_LIMIT_MAX?: number;
}

export default registerAs<AppConfig>('app', () => {
  const env = validateConfig(process.env, EnvironmentVariablesValidator);
  return {
    nodeEnv: env.NODE_ENV ?? Environment.Development,
    port: env.PORT ?? 3000,
    frontendUrl: env.FRONTEND_URL ?? 'http://localhost:3001',
    rateLimit: {
      ttlMs: env.RATE_LIMIT_TTL_MS ?? 60000,
      max: env.RATE_LIMIT_MAX ?? 100,
    },
  };
});
