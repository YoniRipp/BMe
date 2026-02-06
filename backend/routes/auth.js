import crypto from 'crypto';
import { getPool } from '../src/db/index.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';
const SALT_ROUNDS = 10;
const TOKEN_EXPIRY = '7d';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID;
const TWITTER_CLIENT_ID = process.env.TWITTER_CLIENT_ID;
const TWITTER_CLIENT_SECRET = process.env.TWITTER_CLIENT_SECRET;
const TWITTER_REDIRECT_URI = process.env.TWITTER_REDIRECT_URI || 'http://localhost:3000/api/auth/twitter/callback';
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || process.env.CORS_ORIGIN || 'http://localhost:5173';
const twitterPKCEStore = new Map();

function rowToUser(row) {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
    createdAt: row.created_at,
  };
}

export async function register(req, res) {
  try {
    const { email, password, name } = req.body ?? {};
    if (!email || typeof email !== 'string' || !email.trim()) {
      return res.status(400).json({ error: 'email is required' });
    }
    if (!password || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ error: 'password must be at least 6 characters' });
    }
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'name is required' });
    }
    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);
    const pool = getPool();
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, name, role)
       VALUES ($1, $2, $3, 'user')
       RETURNING *`,
      [email.trim().toLowerCase(), password_hash, name.trim()]
    );
    const user = rowToUser(result.rows[0]);
    const token = jwt.sign(
      { sub: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: TOKEN_EXPIRY }
    );
    res.status(201).json({ user, token });
  } catch (e) {
    if (e.code === '23505') {
      return res.status(409).json({ error: 'Email already registered' });
    }
    console.error('register error:', e?.message ?? e);
    res.status(500).json({ error: e?.message ?? 'Registration failed' });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body ?? {};
    if (!email || typeof email !== 'string' || !password) {
      return res.status(400).json({ error: 'email and password are required' });
    }
    const pool = getPool();
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email.trim().toLowerCase()]
    );
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    const row = result.rows[0];
    if (!row.password_hash) {
      return res.status(401).json({ error: 'This account uses social sign-in. Sign in with your provider instead.' });
    }
    const match = await bcrypt.compare(password, row.password_hash);
    if (!match) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    const user = rowToUser(row);
    const token = jwt.sign(
      { sub: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: TOKEN_EXPIRY }
    );
    res.json({ user, token });
  } catch (e) {
    console.error('login error:', e?.message ?? e);
    res.status(500).json({ error: e?.message ?? 'Login failed' });
  }
}

export async function me(req, res) {
  try {
    const pool = getPool();
    const result = await pool.query(
      'SELECT id, email, name, role, created_at FROM users WHERE id = $1',
      [req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(rowToUser(result.rows[0]));
  } catch (e) {
    console.error('me error:', e?.message ?? e);
    res.status(500).json({ error: e?.message ?? 'Failed to get user' });
  }
}

/** Find user by provider or email; create if not found. Returns { user, token }. */
async function findOrCreateProviderUser(pool, { authProvider, providerId, email, name }) {
  const emailNorm = email ? email.trim().toLowerCase() : '';
  const nameTrim = name ? name.trim() : 'Unknown';
  if (!emailNorm && !providerId) {
    throw new Error('email or provider_id required');
  }
  let result = await pool.query(
    'SELECT id, email, name, role, created_at FROM users WHERE auth_provider = $1 AND provider_id = $2',
    [authProvider, providerId]
  );
  if (result.rows.length > 0) {
    const row = result.rows[0];
    const user = rowToUser(row);
    const token = jwt.sign(
      { sub: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: TOKEN_EXPIRY }
    );
    return { user, token };
  }
  if (emailNorm) {
    result = await pool.query(
      'SELECT id, email, name, role, created_at FROM users WHERE email = $1',
      [emailNorm]
    );
    if (result.rows.length > 0) {
      const row = result.rows[0];
      await pool.query(
        'UPDATE users SET auth_provider = $1, provider_id = $2 WHERE id = $3',
        [authProvider, providerId, row.id]
      );
      const user = rowToUser(row);
      const token = jwt.sign(
        { sub: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: TOKEN_EXPIRY }
      );
      return { user, token };
    }
  }
  const insertEmail = emailNorm || `${authProvider}-${providerId}@social.local`;
  result = await pool.query(
    `INSERT INTO users (email, password_hash, name, role, auth_provider, provider_id)
     VALUES ($1, NULL, $2, 'user', $3, $4)
     RETURNING id, email, name, role, created_at`,
    [insertEmail, nameTrim, authProvider, providerId]
  );
  const user = rowToUser(result.rows[0]);
  const token = jwt.sign(
    { sub: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: TOKEN_EXPIRY }
  );
  return { user, token };
}

export async function loginGoogle(req, res) {
  if (!GOOGLE_CLIENT_ID) {
    return res.status(503).json({ error: 'Google sign-in is not configured (missing GOOGLE_CLIENT_ID)' });
  }
  try {
    const token = typeof req.body?.token === 'string' ? req.body.token.trim() : '';
    if (!token) {
      return res.status(400).json({ error: 'token is required' });
    }
    let sub;
    let email = '';
    let name = 'User';
    const isJwt = token.split('.').length === 3;
    if (isJwt) {
      const client = new OAuth2Client(GOOGLE_CLIENT_ID);
      const ticket = await client.verifyIdToken({ idToken: token, audience: GOOGLE_CLIENT_ID });
      const payload = ticket.getPayload();
      sub = payload?.sub;
      email = payload?.email || '';
      name = [payload?.given_name, payload?.family_name].filter(Boolean).join(' ') || payload?.name || email || 'User';
    } else {
      const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!userRes.ok) {
        const text = await userRes.text();
        console.error('Google userinfo error:', userRes.status, text);
        return res.status(401).json({ error: 'Invalid Google token' });
      }
      const data = await userRes.json();
      sub = data?.id;
      email = data?.email || '';
      name = [data?.given_name, data?.family_name].filter(Boolean).join(' ') || data?.name || email || 'User';
    }
    if (!sub) {
      return res.status(401).json({ error: 'Invalid Google token' });
    }
    const pool = getPool();
    const { user, token: jwtToken } = await findOrCreateProviderUser(pool, {
      authProvider: 'google',
      providerId: sub,
      email,
      name,
    });
    res.json({ user, token: jwtToken });
  } catch (e) {
    console.error('loginGoogle error:', e?.message ?? e);
    res.status(401).json({ error: e?.message ?? 'Google sign-in failed' });
  }
}

export async function loginFacebook(req, res) {
  if (!FACEBOOK_APP_ID) {
    return res.status(503).json({ error: 'Facebook sign-in is not configured (missing FACEBOOK_APP_ID)' });
  }
  try {
    const token = typeof req.body?.token === 'string' ? req.body.token.trim() : '';
    if (!token) {
      return res.status(400).json({ error: 'token is required' });
    }
    const url = `https://graph.facebook.com/me?fields=id,email,name&access_token=${encodeURIComponent(token)}`;
    const response = await fetch(url);
    if (!response.ok) {
      const text = await response.text();
      console.error('Facebook Graph error:', response.status, text);
      return res.status(401).json({ error: 'Invalid Facebook token' });
    }
    const data = await response.json();
    const providerId = data?.id;
    const email = data?.email || '';
    const name = data?.name || email || 'User';
    if (!providerId) {
      return res.status(401).json({ error: 'Invalid Facebook token' });
    }
    const pool = getPool();
    const { user, token: jwtToken } = await findOrCreateProviderUser(pool, {
      authProvider: 'facebook',
      providerId,
      email,
      name,
    });
    res.json({ user, token: jwtToken });
  } catch (e) {
    console.error('loginFacebook error:', e?.message ?? e);
    res.status(401).json({ error: e?.message ?? 'Facebook sign-in failed' });
  }
}

export async function loginTwitter(req, res) {
  if (!TWITTER_CLIENT_ID) {
    return res.status(503).json({ error: 'Twitter sign-in is not configured (missing TWITTER_CLIENT_ID)' });
  }
  try {
    const token = typeof req.body?.token === 'string' ? req.body.token.trim() : '';
    if (!token) {
      return res.status(400).json({ error: 'token is required' });
    }
    const response = await fetch('https://api.twitter.com/2/users/me?user.fields=id,name,username', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) {
      const text = await response.text();
      console.error('Twitter API error:', response.status, text);
      return res.status(401).json({ error: 'Invalid Twitter token' });
    }
    const data = await response.json();
    const userData = data?.data;
    const providerId = userData?.id;
    const name = userData?.name || userData?.username || 'User';
    const email = ''; // Twitter OAuth 2.0 userinfo may not include email; use placeholder if needed
    if (!providerId) {
      return res.status(401).json({ error: 'Invalid Twitter token' });
    }
    const pool = getPool();
    const { user, token: jwtToken } = await findOrCreateProviderUser(pool, {
      authProvider: 'twitter',
      providerId,
      email,
      name,
    });
    res.json({ user, token: jwtToken });
  } catch (e) {
    console.error('loginTwitter error:', e?.message ?? e);
    res.status(401).json({ error: e?.message ?? 'Twitter sign-in failed' });
  }
}

function base64UrlEncode(buf) {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function twitterRedirect(req, res) {
  if (!TWITTER_CLIENT_ID) {
    return res.status(503).send('Twitter sign-in is not configured');
  }
  const state = crypto.randomBytes(16).toString('hex');
  const codeVerifier = base64UrlEncode(crypto.randomBytes(32));
  const codeChallenge = base64UrlEncode(
    crypto.createHash('sha256').update(codeVerifier).digest()
  );
  twitterPKCEStore.set(state, { codeVerifier });
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: TWITTER_CLIENT_ID,
    redirect_uri: TWITTER_REDIRECT_URI,
    scope: 'tweet.read users.read offline.access',
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  });
  res.redirect(`https://twitter.com/i/oauth2/authorize?${params.toString()}`);
}

export async function twitterCallback(req, res) {
  const { code, state } = req.query ?? {};
  const stored = state && twitterPKCEStore.get(state);
  if (!code || typeof code !== 'string' || !stored) {
    return res.redirect(`${FRONTEND_ORIGIN}/login?error=twitter_callback_failed`);
  }
  twitterPKCEStore.delete(state);
  try {
    const tokenRes = await fetch('https://api.twitter.com/2/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(
          `${encodeURIComponent(TWITTER_CLIENT_ID)}:${encodeURIComponent(TWITTER_CLIENT_SECRET || '')}`
        ).toString('base64')}`,
      },
      body: new URLSearchParams({
        code,
        grant_type: 'authorization_code',
        redirect_uri: TWITTER_REDIRECT_URI,
        code_verifier: stored.codeVerifier,
      }).toString(),
    });
    if (!tokenRes.ok) {
      const text = await tokenRes.text();
      console.error('Twitter token exchange error:', tokenRes.status, text);
      return res.redirect(`${FRONTEND_ORIGIN}/login?error=twitter_token_failed`);
    }
    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;
    if (!accessToken) {
      return res.redirect(`${FRONTEND_ORIGIN}/login?error=twitter_token_failed`);
    }
    const userRes = await fetch('https://api.twitter.com/2/users/me?user.fields=id,name,username', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!userRes.ok) {
      return res.redirect(`${FRONTEND_ORIGIN}/login?error=twitter_user_failed`);
    }
    const userData = (await userRes.json())?.data;
    const providerId = userData?.id;
    const name = userData?.name || userData?.username || 'User';
    const email = '';
    if (!providerId) {
      return res.redirect(`${FRONTEND_ORIGIN}/login?error=twitter_user_failed`);
    }
    const pool = getPool();
    const { user, token: jwtToken } = await findOrCreateProviderUser(pool, {
      authProvider: 'twitter',
      providerId,
      email,
      name,
    });
    const redirectUrl = `${FRONTEND_ORIGIN}/auth/callback?token=${encodeURIComponent(jwtToken)}`;
    res.redirect(redirectUrl);
  } catch (e) {
    console.error('twitterCallback error:', e?.message ?? e);
    res.redirect(`${FRONTEND_ORIGIN}/login?error=twitter_callback_failed`);
  }
}
