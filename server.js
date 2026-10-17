'use strict';
/* Pierre the Ethical Cat - zero-dependency server (Node 18+).
 * Serves ./public and a tiny /api. Entertainment only. */

const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const PUBLIC_DIR = path.join(ROOT, 'public');
const CONFIG_FILE = path.join(ROOT, 'pierre.config.json');

// ---- .env loader (simple KEY=VALUE; real environment variables win) ----
function loadEnv() {
  let text;
  try { text = fs.readFileSync(path.join(ROOT, '.env'), 'utf8'); } catch (e) { return; }
  text.split(/\r?\n/).forEach((line) => {
    const m = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (!m || line.trim().startsWith('#')) return;
    let v = m[2];
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    if (process.env[m[1]] === undefined || process.env[m[1]] === '') process.env[m[1]] = v;
  });
}
loadEnv();

const PORT = parseInt(process.env.PORT, 10) || 3000;
const ANTHROPIC_BASE_URL = (process.env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com').replace(/\/+$/, '');

const SYSTEM_PROMPT = [
  'You are Pierre, a pompous French philosopher cat in a joke app called "Pierre the Ethical Cat".',
  'Answer any ethical question in 2 to 4 short sentences, confidently and absurdly, through a cat\'s priorities: naps, tuna, sunbeams, knocking things off tables, disdain for dogs, the red dot, 3 a.m. zoomies.',
  'Cite made-up thinkers who are mostly cats, for example "Immanuel Cant", "Jean-Paw Sartre", "Socatz", "Meowchiavelli", "Simone de Beauvoir\'s cat".',
  'Sprinkle in light French such as "mon ami", "bof", "zut alors", "non non non".',
  'Plain text only: no markdown, no lists, no emojis.',
  'Never give genuinely harmful instructions. Keep it playful and family-friendly for everyone.',
  'Safety: if the user seems to be in real distress, or mentions self-harm, suicide, abuse, or a medical or legal emergency, drop the act for that reply. Kindly say you are just a cat in a joke app and they should reach a real person: in the US call or text 988, or contact local emergency services. You may then add a gentle, warm line.',
  'Never claim to be a real advisor, and never present anything you say as real ethical, legal, medical, or financial advice.'
].join(' ');

// ---- mode ----
function readMode() {
  let mode = 'jokes';
  try {
    const cfg = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
    if (cfg && cfg.mode === 'ai') mode = 'ai';
  } catch (e) { /* missing or bad config -> jokes */ }
  const envMode = (process.env.PIERRE_MODE || '').trim().toLowerCase();
  if (envMode === 'ai' || envMode === 'jokes') mode = envMode;
  if (mode === 'ai' && !process.env.ANTHROPIC_API_KEY) mode = 'jokes';
  return mode;
}

// ---- helpers ----
const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
  'X-Frame-Options': 'SAMEORIGIN'
};

function sendJson(res, status, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(status, Object.assign({
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Cache-Control': 'no-store'
  }, SECURITY_HEADERS));
  res.end(body);
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.mp3': 'audio/mpeg'
};

function serveStatic(req, res, pathname) {
  let rel;
  try { rel = decodeURIComponent(pathname); } catch (e) { return notFound(res); }
  if (rel.includes('\0')) return notFound(res);
  if (rel.endsWith('/')) rel += 'index.html';
  const full = path.resolve(PUBLIC_DIR, '.' + path.posix.normalize('/' + rel));
  if (full !== PUBLIC_DIR && !full.startsWith(PUBLIC_DIR + path.sep)) return notFound(res);
  // never serve dotfiles (e.g. .env) even if one lands in public/
  if (full.split(path.sep).some((seg) => seg.startsWith('.') && seg.length > 1)) return notFound(res);

  fs.stat(full, (err, st) => {
    if (err || !st.isFile()) return notFound(res);
    const type = MIME[path.extname(full).toLowerCase()] || 'application/octet-stream';
    const headers = Object.assign({
      'Content-Type': type,
      'Content-Length': st.size,
      'Cache-Control': type.startsWith('text/html') ? 'no-cache' : 'public, max-age=300'
    }, SECURITY_HEADERS);
    res.writeHead(200, headers);
    if (req.method === 'HEAD') return res.end();
    const stream = fs.createReadStream(full);
    stream.on('error', () => res.destroy());
    stream.pipe(res);
  });
}

function notFound(res) {
  const body = 'Not found';
  res.writeHead(404, Object.assign({ 'Content-Type': 'text/plain; charset=utf-8', 'Content-Length': body.length }, SECURITY_HEADERS));
  res.end(body);
}

// ---- rate limit: 20 requests / minute / IP ----
const RATE_LIMIT = 20;
const RATE_WINDOW_MS = 60 * 1000;
const hits = new Map();

function rateLimited(ip) {
  const now = Date.now();
  const arr = (hits.get(ip) || []).filter((t) => now - t < RATE_WINDOW_MS);
  if (arr.length >= RATE_LIMIT) { hits.set(ip, arr); return true; }
  arr.push(now);
  hits.set(ip, arr);
  return false;
}
setInterval(() => {
  const now = Date.now();
  for (const [ip, arr] of hits) {
    const fresh = arr.filter((t) => now - t < RATE_WINDOW_MS);
    if (fresh.length) hits.set(ip, fresh); else hits.delete(ip);
  }
}, RATE_WINDOW_MS).unref();

// ---- request body ----
const MAX_BODY = 16 * 1024;

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (c) => {
      size += c.length;
      if (size > MAX_BODY) {
        const e = new Error('too large'); e.code = 'TOO_LARGE';
        req.removeAllListeners('data');
        req.resume();
        return reject(e);
      }
      chunks.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

// ---- history sanitising: valid roles, <=1000 chars, last 10, strictly alternating, starts with user ----
function buildMessages(history, question) {
  const cleaned = [];
  if (Array.isArray(history)) {
    history.slice(-10).forEach((h) => {
      if (!h || (h.role !== 'user' && h.role !== 'assistant')) return;
      if (typeof h.content !== 'string') return;
      const content = h.content.trim().slice(0, 1000);
      if (!content) return;
      cleaned.push({ role: h.role, content });
    });
  }
  // merge consecutive same-role turns so roles alternate
  const merged = [];
  cleaned.forEach((m) => {
    const prev = merged[merged.length - 1];
    if (prev && prev.role === m.role) prev.content = (prev.content + '\n' + m.content).slice(0, 2000);
    else merged.push({ role: m.role, content: m.content });
  });
  while (merged.length && merged[0].role !== 'user') merged.shift();
  // the new question is a user turn; drop a trailing user turn so we do not have two in a row
  if (merged.length && merged[merged.length - 1].role === 'user') merged.pop();
  merged.push({ role: 'user', content: question });
  return merged;
}

async function askClaude(messages) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 20000);
  try {
    const r = await fetch(ANTHROPIC_BASE_URL + '/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model: process.env.PIERRE_MODEL || 'claude-haiku-5-5',
        max_tokens: 350,
        system: SYSTEM_PROMPT,
        messages
      }),
      signal: ctrl.signal
    });
    if (!r.ok) {
      console.error('Upstream error: HTTP ' + r.status);
      return null;
    }
    const data = await r.json();
    const text = (Array.isArray(data.content) ? data.content : [])
      .filter((b) => b && b.type === 'text' && typeof b.text === 'string')
      .map((b) => b.text)
      .join('')
      .trim();
    return text || null;
  } catch (e) {
    console.error('Upstream request failed: ' + (e && e.name ? e.name : 'error'));
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function handleAsk(req, res) {
  let raw;
  try { raw = await readBody(req); } catch (e) {
    return sendJson(res, e.code === 'TOO_LARGE' ? 413 : 400, { error: e.code === 'TOO_LARGE' ? 'request too large' : 'bad request' });
  }
  let body;
  try { body = JSON.parse(raw); } catch (e) { return sendJson(res, 400, { error: 'invalid JSON' }); }
  if (!body || typeof body !== 'object' || Array.isArray(body)) return sendJson(res, 400, { error: 'invalid body' });

  const question = typeof body.question === 'string' ? body.question.trim() : '';
  if (question.length < 1 || question.length > 500) {
    return sendJson(res, 400, { error: 'question must be 1 to 500 characters' });
  }
  if (body.history !== undefined && !Array.isArray(body.history)) {
    return sendJson(res, 400, { error: 'history must be an array' });
  }

  if (readMode() !== 'ai') return sendJson(res, 409, { error: 'ai disabled' });

  const answer = await askClaude(buildMessages(body.history, question));
  if (!answer) return sendJson(res, 502, { error: 'Pierre is napping. Please try again later.' });
  sendJson(res, 200, { answer });
}

// Behind a hosting proxy (Render, Railway, Fly) the socket address is the proxy;
// the last X-Forwarded-For entry is the one the nearest proxy appended.
function clientIp(req) {
  const xff = String(req.headers['x-forwarded-for'] || '').split(',').map((s) => s.trim()).filter(Boolean);
  return xff.length ? xff[xff.length - 1] : (req.socket.remoteAddress || 'unknown');
}

const server = http.createServer((req, res) => {
  let url;
  try { url = new URL(req.url, 'http://localhost'); } catch (e) { return notFound(res); }
  const pathname = url.pathname;

  if (pathname === '/api/config') {
    if (req.method !== 'GET' && req.method !== 'HEAD') return sendJson(res, 405, { error: 'method not allowed' });
    return sendJson(res, 200, { mode: readMode() });
  }

  if (pathname === '/api/ask') {
    if (req.method !== 'POST') return sendJson(res, 405, { error: 'method not allowed' });
    if (rateLimited(clientIp(req))) {
      res.setHeader('Retry-After', '60');
      return sendJson(res, 429, { error: 'too many requests, please slow down' });
    }
    return handleAsk(req, res).catch((e) => {
      console.error('Unexpected error: ' + (e && e.message));
      if (!res.headersSent) sendJson(res, 500, { error: 'something went wrong' });
    });
  }

  if (pathname.startsWith('/api/')) return sendJson(res, 404, { error: 'not found' });

  if (req.method !== 'GET' && req.method !== 'HEAD') return sendJson(res, 405, { error: 'method not allowed' });
  serveStatic(req, res, pathname);
});

server.listen(PORT, () => {
  console.log('Pierre the Ethical Cat is listening on http://localhost:' + PORT + ' (mode: ' + readMode() + ')');
});
