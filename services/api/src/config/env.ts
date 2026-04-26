import { z } from 'zod';

export const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  PORT: z.string().transform(Number),
  FRONTEND_URL: z.string().url().optional().default('http://localhost:5173'),
  NODE_ENV: z.enum(['development', 'production', 'test']).optional().default('development'),
  STRIPE_SECRET_KEY: z.string().min(1, 'STRIPE_SECRET_KEY is required'),
  STRIPE_WEBHOOK_SECRET: z.string().min(1, 'STRIPE_WEBHOOK_SECRET is required'),
  STRIPE_PLATFORM_FEE_PERCENT: z.string().transform(Number).optional().default('10'),
});

export type Env = z.infer<typeof envSchema>;

let env: Env | null = null;

export function getEnv(): Env {
  if (env) return env;

  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error('❌ Environment validation failed:');
    console.error(result.error.format());
    throw new Error('Invalid environment variables');
  }

  env = result.data;
  return env;
}

export const config = getEnv();
