import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  NEXT_PUBLIC_API_BASE_URL: z
    .string({
      error: (issue) =>
        issue.input === undefined ? 'NEXT_PUBLIC_API_BASE_URL is required' : undefined,
    })
    .refine(
      (val) => val.startsWith('/') || /^https?:\/\//.test(val),
      'NEXT_PUBLIC_API_BASE_URL must be a valid URL or relative path starting with /',
    ),
});

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  const isDevelopment = (process.env.NODE_ENV ?? 'development') === 'development';

  const rawEnv = {
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_API_BASE_URL:
      process.env.NEXT_PUBLIC_API_BASE_URL ||
      (isDevelopment ? 'http://localhost:4000/api/v1' : '/api/v1'),
  };

  const result = envSchema.safeParse(rawEnv);

  if (!result.success) {
    const errorDetails = result.error.issues
      .map((err) => `  - ${err.path.join('.')}: ${err.message}`)
      .join('\n');

    throw new Error(`Environment configuration validation failed:\n${errorDetails}`);
  }

  return Object.freeze(result.data);
}

export const env = loadEnv();
