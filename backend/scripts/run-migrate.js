#!/usr/bin/env node
/**
 * Runs node-pg-migrate with env loaded from .env and .env.development (or .env.production).
 */
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

dotenv.config({ path: path.join(root, '.env') });
const mode = process.env.NODE_ENV || 'development';
dotenv.config({ path: path.join(root, `.env.${mode}`) });

const { execSync } = await import('child_process');
execSync('node-pg-migrate up', { stdio: 'inherit', cwd: root });
