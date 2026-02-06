import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });
dotenv.config({ path: path.join(__dirname, '.env') });

import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

const BEME_API_URL = process.env.BEME_API_URL || 'http://localhost:3000';

async function apiGet(path) {
  const res = await fetch(`${BEME_API_URL}${path}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || res.statusText || `Request failed: ${res.status}`);
  }
  return res.json();
}

async function apiPost(path, body) {
  const res = await fetch(`${BEME_API_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || res.statusText || `Request failed: ${res.status}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

async function apiDelete(path) {
  const res = await fetch(`${BEME_API_URL}${path}`, { method: 'DELETE' });
  if (!res.ok && res.status !== 204) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || res.statusText || `Request failed: ${res.status}`);
  }
  return null;
}

function textContent(text) {
  return { content: [{ type: 'text', text }] };
}

const server = new McpServer({
  name: 'beme',
  version: '1.0.0',
});

// --- Tools ---

server.tool(
  'add_schedule_item',
  'Add one item to the daily schedule.',
  z.object({
    title: z.string().describe('Activity title'),
    startTime: z.string().optional().describe('Start time HH:MM'),
    endTime: z.string().optional().describe('End time HH:MM'),
    category: z.string().optional().describe('One of: Work, Exercise, Meal, Sleep, Personal, Social, Other'),
  }),
  async ({ title, startTime, endTime, category }) => {
    const result = await apiPost('/api/schedule', { title, startTime, endTime, category });
    return textContent(JSON.stringify(result, null, 2));
  }
);

server.tool(
  'list_schedule',
  'List schedule items (active only).',
  z.object({}),
  async () => {
    const items = await apiGet('/api/schedule');
    return textContent(JSON.stringify(items, null, 2));
  }
);

server.tool(
  'delete_schedule_item',
  'Remove a schedule item by id.',
  z.object({
    id: z.string().describe('Schedule item id (UUID)'),
  }),
  async ({ id }) => {
    await apiDelete(`/api/schedule/${id}`);
    return textContent('Deleted.');
  }
);

server.tool(
  'add_transaction',
  'Add an income or expense transaction.',
  z.object({
    type: z.enum(['income', 'expense']),
    amount: z.number().min(0),
    category: z.string().optional(),
    description: z.string().optional(),
    date: z.string().optional().describe('YYYY-MM-DD'),
    isRecurring: z.boolean().optional(),
  }),
  async (args) => {
    const result = await apiPost('/api/transactions', args);
    return textContent(JSON.stringify(result, null, 2));
  }
);

server.tool(
  'list_transactions',
  'List transactions. Optional: month (YYYY-MM), type (income|expense).',
  z.object({
    month: z.string().optional().describe('YYYY-MM'),
    type: z.enum(['income', 'expense']).optional(),
  }),
  async ({ month, type } = {}) => {
    const q = new URLSearchParams();
    if (month) q.set('month', month);
    if (type) q.set('type', type);
    const items = await apiGet('/api/transactions' + (q.toString() ? '?' + q : ''));
    return textContent(JSON.stringify(items, null, 2));
  }
);

server.tool(
  'get_balance',
  'Get current balance (income - expenses). Optional: month (YYYY-MM).',
  z.object({
    month: z.string().optional().describe('YYYY-MM'),
  }),
  async ({ month } = {}) => {
    const path = month ? `/api/balance?month=${encodeURIComponent(month)}` : '/api/balance';
    const result = await apiGet(path);
    return textContent(JSON.stringify(result, null, 2));
  }
);

server.tool(
  'add_goal',
  'Add a goal.',
  z.object({
    type: z.enum(['calories', 'workouts', 'savings']),
    target: z.number().min(0),
    period: z.enum(['weekly', 'monthly', 'yearly']),
  }),
  async (args) => {
    const result = await apiPost('/api/goals', args);
    return textContent(JSON.stringify(result, null, 2));
  }
);

server.tool(
  'list_goals',
  'List all goals.',
  z.object({}),
  async () => {
    const items = await apiGet('/api/goals');
    return textContent(JSON.stringify(items, null, 2));
  }
);

// --- Resources ---

server.resource(
  'schedule_today',
  'beme://schedule/today',
  { title: "Today's schedule" },
  async (uri) => {
    const items = await apiGet('/api/schedule');
    return {
      contents: [{ uri: uri.toString(), mimeType: 'application/json', text: JSON.stringify(items, null, 2) }],
    };
  }
);

server.resource(
  'transactions_this_month',
  'beme://transactions/this_month',
  { title: "This month's transactions" },
  async (uri) => {
    const month = new Date().toISOString().slice(0, 7);
    const items = await apiGet(`/api/transactions?month=${month}`);
    return {
      contents: [{ uri: uri.toString(), mimeType: 'application/json', text: JSON.stringify(items, null, 2) }],
    };
  }
);

server.resource(
  'goals',
  'beme://goals',
  { title: 'Current goals' },
  async (uri) => {
    const items = await apiGet('/api/goals');
    return {
      contents: [{ uri: uri.toString(), mimeType: 'application/json', text: JSON.stringify(items, null, 2) }],
    };
  }
);

// --- Run ---

const transport = new StdioServerTransport();
await server.connect(transport);
