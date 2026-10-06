import type { AuthConfig } from '../auth/config/auth-config.type.js';
import type { DatabaseConfig } from '../prisma/config/database-config.type.js';
import type { RagConfig } from '../rag/config/rag-config.type.js';
import type { AppConfig } from './app-config.type.js';

/** Every config section, keyed by the name it was registered under with registerAs(). */
export type AllConfigType = {
  app: AppConfig;
  auth: AuthConfig;
  database: DatabaseConfig;
  rag: RagConfig;
};
