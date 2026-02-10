/**
 * Application configuration. Loads env and exports config object.
 * Validated at startup with Zod.
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { z } from 'zod';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(__dirname, '../..');

// Load .env first, then mode-specific file (.env.development or .env.production)
dotenv.config({ path: path.join(backendRoot, '.env') });
const mode = process.env.NODE_ENV || 'development';
dotenv.config({ path: path.join(backendRoot, `.env.${mode}`) });

const isProduction = process.env.NODE_ENV === 'production';

const configSchema = z.object({
  port: z.coerce.number().int().min(1).max(65535),
  dbUrl: z.string().optional(),
  isDbConfigured: z.boolean(),
  geminiApiKey: z.string().optional(),
  geminiModel: z.string(),
  jwtSecret: z.string().nullable().refine((v) => !isProduction || (v != null && v.length > 0), {
    message: 'JWT_SECRET must be set in production',
  }),
  corsOrigin: z.union([z.string(), z.boolean()]),
  frontendOrigin: z.string(),
  googleClientId: z.string().optional(),
  facebookAppId: z.string().optional(),
  twitterClientId: z.string().optional(),
  twitterClientSecret: z.string().optional(),
  twitterRedirectUri: z.string(),
});

const PORT = process.env.PORT ?? 3000;
const DATABASE_URL = process.env.DATABASE_URL;
const JWT_SECRET = process.env.JWT_SECRET || (isProduction ? null : 'dev-secret-change-in-production');
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || process.env.CORS_ORIGIN || 'http://localhost:5173';
const CORS_ORIGIN = process.env.CORS_ORIGIN != null && process.env.CORS_ORIGIN !== ''
  ? process.env.CORS_ORIGIN
  : (isProduction ? FRONTEND_ORIGIN : true);
if (isProduction && CORS_ORIGIN === FRONTEND_ORIGIN && !process.env.CORS_ORIGIN) {
  console.warn('CORS_ORIGIN not set in production; using FRONTEND_ORIGIN. Set CORS_ORIGIN explicitly for security.');
}

const rawConfig = {
  port: Number(PORT),
  dbUrl: DATABASE_URL,
  isDbConfigured: !!DATABASE_URL,
  geminiApiKey: process.env.GEMINI_API_KEY,
  geminiModel: process.env.GEMINI_MODEL,
  jwtSecret: JWT_SECRET,
  corsOrigin: CORS_ORIGIN,
  frontendOrigin: FRONTEND_ORIGIN,
  googleClientId: process.env.GOOGLE_CLIENT_ID,
  facebookAppId: process.env.FACEBOOK_APP_ID,
  twitterClientId: process.env.TWITTER_CLIENT_ID,
  twitterClientSecret: process.env.TWITTER_CLIENT_SECRET,
  twitterRedirectUri: process.env.TWITTER_REDIRECT_URI || 'http://localhost:3000/api/auth/twitter/callback',
};

const parsed = configSchema.safeParse(rawConfig);
if (!parsed.success) {
  const first = parsed.error.errors[0];
  throw new Error(first ? `${first.path.join('.')}: ${first.message}` : 'Invalid configuration');
}

export const config = parsed.data;
