import type { AuthConfig } from '../auth/config/auth-config.type.js';
import type { AppConfig } from './app-config.type.js';

/** Every config section, keyed by the name it was registered under with registerAs(). */
export type AllConfigType = {
  app: AppConfig;
  auth: AuthConfig;
};
