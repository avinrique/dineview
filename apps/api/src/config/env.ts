import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string(),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  JWT_ACCESS_SECRET: z.string(),
  JWT_REFRESH_SECRET: z.string(),
  JWT_SESSION_SECRET: z.string(),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  // Public URL of the web app, used when encoding QR codes. Falls back to the
  // first CORS origin.
  WEB_URL: z.string().optional(),
  // When set, `/scan/demo` opens a table at this restaurant (landing-page demo).
  DEMO_RESTAURANT_SLUG: z.string().optional(),
  // Uploaded dish photos and 3D models are stored here and served at /uploads.
  UPLOAD_DIR: z.string().default('./uploads'),
  S3_ENDPOINT: z.string().default('http://localhost:9000'),
  S3_ACCESS_KEY: z.string().default('dineview'),
  S3_SECRET_KEY: z.string().default('dineview_dev'),
  S3_BUCKET: z.string().default('dineview-assets'),
  S3_REGION: z.string().default('us-east-1'),
});

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error('❌ Invalid environment variables:', result.error.flatten().fieldErrors);
    process.exit(1);
  }
  return result.data;
}

export const env = loadEnv();

export const webUrl = (env.WEB_URL || env.CORS_ORIGIN.split(',')[0] || '').trim().replace(/\/+$/, '');
