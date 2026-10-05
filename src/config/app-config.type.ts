export type AppConfig = {
  nodeEnv: 'development' | 'test' | 'production';
  port: number;
  frontendUrl: string;
  rateLimit: {
    ttlMs: number;
    max: number;
  };
};
