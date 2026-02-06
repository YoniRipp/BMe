/**
 * Application configuration. Loads env and exports config object.
 */
import 'dotenv/config';

const DATABASE_URL = process.env.DATABASE_URL;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const isProduction = process.env.NODE_ENV === 'production';
const JWT_SECRET = process.env.JWT_SECRET || (isProduction ? null : 'dev-secret-change-in-production');
if (isProduction && !JWT_SECRET) {
  throw new Error('JWT_SECRET must be set in production. Set the JWT_SECRET environment variable.');
}
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || process.env.CORS_ORIGIN || 'http://localhost:5173';
const CORS_ORIGIN = process.env.CORS_ORIGIN != null && process.env.CORS_ORIGIN !== ''
  ? process.env.CORS_ORIGIN
  : (isProduction ? FRONTEND_ORIGIN : true);
if (isProduction && CORS_ORIGIN === FRONTEND_ORIGIN && !process.env.CORS_ORIGIN) {
  console.warn('CORS_ORIGIN not set in production; using FRONTEND_ORIGIN. Set CORS_ORIGIN explicitly for security.');
}
const PORT = process.env.PORT ?? 3000;

export const config = {
  port: Number(PORT),
  dbUrl: DATABASE_URL,
  isDbConfigured: !!DATABASE_URL,
  geminiApiKey: GEMINI_API_KEY,
  geminiModel: GEMINI_MODEL,
  jwtSecret: JWT_SECRET,
  corsOrigin: CORS_ORIGIN,
  frontendOrigin: FRONTEND_ORIGIN,
  googleClientId: process.env.GOOGLE_CLIENT_ID,
  facebookAppId: process.env.FACEBOOK_APP_ID,
  twitterClientId: process.env.TWITTER_CLIENT_ID,
  twitterClientSecret: process.env.TWITTER_CLIENT_SECRET,
  twitterRedirectUri: process.env.TWITTER_REDIRECT_URI || 'http://localhost:3000/api/auth/twitter/callback',
};
