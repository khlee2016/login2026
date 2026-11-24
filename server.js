const express = require('express');
const crypto = require('crypto');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

const users = new Map();
const sessions = new Map();

app.use(express.json({ limit: '16kb' }));
app.use(express.static(path.join(__dirname, 'public')));

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  const [salt, storedHash] = stored.split(':');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(storedHash, 'hex'));
}

function parseCookies(req) {
  const cookies = {};
  for (const part of (req.headers.cookie || '').split(';')) {
    const [key, ...value] = part.trim().split('=');
    if (key) cookies[key] = decodeURIComponent(value.join('='));
  }
  return cookies;
}

function getSession(req) {
  const token = parseCookies(req).session;
  return token ? sessions.get(token) : null;
}

function setSession(res, username) {
  const token = crypto.randomBytes(32).toString('hex');
  sessions.set(token, { username });
  res.setHeader('Set-Cookie', `session=${token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=86400`);
}

app.post('/api/register', (req, res) => {
  const username = String(req.body.username || '').trim();
  const password = String(req.body.password || '');

  if (username.length < 3 || username.length > 20) {
    return res.status(400).json({ error: '아이디는 3~20자여야 합니다.' });
  }
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return res.status(400).json({ error: '아이디는 영문, 숫자, 밑줄만 사용할 수 있습니다.' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: '비밀번호는 6자 이상이어야 합니다.' });
  }
  if (users.has(username.toLowerCase())) {
    return res.status(409).json({ error: '이미 사용 중인 아이디입니다.' });
  }

  users.set(username.toLowerCase(), { username, passwordHash: hashPassword(password) });
  setSession(res, username);
  res.status(201).json({ username });
});

app.post('/api/login', (req, res) => {
  const username = String(req.body.username || '').trim();
  const password = String(req.body.password || '');
  const user = users.get(username.toLowerCase());

  if (!user || !verifyPassword(password, user.passwordHash)) {
    return res.status(401).json({ error: '아이디 또는 비밀번호가 올바르지 않습니다.' });
  }

  setSession(res, user.username);
  res.json({ username: user.username });
});

app.get('/api/me', (req, res) => {
  const session = getSession(req);
  if (!session) return res.status(401).json({ username: null });
  res.json({ username: session.username });
});

app.post('/api/logout', (req, res) => {
  const token = parseCookies(req).session;
  if (token) sessions.delete(token);
  res.setHeader('Set-Cookie', 'session=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0');
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`로그인 서버가 http://localhost:${PORT} 에서 실행 중입니다.`);
});
