import { registerAs } from '@nestjs/config';
import { IsUrl } from 'class-validator';
import { validateConfig } from '../../utils/validate-config.js';
import type { DatabaseConfig } from './database-config.type.js';

class EnvironmentVariablesValidator {
  /** Prisma reads this directly (schema.prisma); validating it here gives a clear error at startup. */
  @IsUrl({
    protocols: ['postgresql', 'postgres'],
    require_protocol: true,
    require_tld: false,
  })
  DATABASE_URL!: string;
}

export default registerAs<DatabaseConfig>('database', () => {
  const env = validateConfig(process.env, EnvironmentVariablesValidator);
  return { url: env.DATABASE_URL };
});
