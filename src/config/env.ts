import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(4000),
  HOST: z.string().default('0.0.0.0'),
  API_PREFIX: z.string().default('/api/v1'),
  CORS_ORIGIN: z.string().default('*'),

  // Database
  DATABASE_URL: z.string().default('postgresql://jansamadhan:jansamadhan_secret@localhost:5432/jansamadhan_db?schema=public'),

  // Redis
  REDIS_URL: z.string().default('redis://localhost:6379'),

  // JWT
  JWT_ACCESS_SECRET: z.string().min(16).default('dev_jwt_access_secret_min_32_characters_random_string_here'),
  JWT_ACCESS_EXPIRATION: z.string().default('15m'),
  JWT_REFRESH_SECRET: z.string().min(16).default('dev_jwt_refresh_secret_min_32_characters_random_string_here'),
  JWT_REFRESH_EXPIRATION: z.string().default('7d'),

  // Storage
  STORAGE_PROVIDER: z.enum(['local', 's3']).default('local'),
  STORAGE_LOCAL_DIR: z.string().default('./uploads'),
  S3_ENDPOINT: z.string().optional(),
  S3_REGION: z.string().default('us-east-1'),
  S3_BUCKET: z.string().default('jansamadhan-evidence'),
  S3_ACCESS_KEY: z.string().optional(),
  S3_SECRET_KEY: z.string().optional(),
  S3_FORCE_PATH_STYLE: z.string().default('true'),

  // Email
  EMAIL_PROVIDER: z.enum(['mock', 'smtp']).default('mock'),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  EMAIL_FROM: z.string().default('JanSamadhan <no-reply@jansamadhan.jharkhand.gov.in>'),

  // AI & Embeddings
  AI_PROVIDER: z.enum(['mock', 'gemini', 'openai']).default('mock'),
  AI_API_KEY: z.string().optional(),
  AI_MODEL_NAME: z.string().default('gemini-1.5-flash'),
  EMBEDDING_PROVIDER: z.enum(['mock', 'gemini', 'openai']).default('mock'),
  EMBEDDING_MODEL_NAME: z.string().default('text-embedding-004'),
  EMBEDDING_DIMENSION: z.coerce.number().default(768),

  // Logging
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(900000), // 15 mins
  RATE_LIMIT_MAX: z.coerce.number().default(1000),
});

export type EnvConfig = z.infer<typeof envSchema>;

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:', JSON.stringify(parsed.error.format(), null, 2));
  throw new Error('Environment variable validation failed');
}

export const env: EnvConfig = parsed.data;

