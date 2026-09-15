/*
 * 微信小程序授权登录服务。
 *
 * 仅服务端持有 AppSecret：小程序传入 wx.login / getPhoneNumber 返回的一次性 code，
 * 服务端再向微信换取 openid 和手机号，避免凭证泄露到客户端。
 */
const crypto = require('crypto');
const fs = require('fs');
const http = require('http');
const path = require('path');

loadEnv(path.join(__dirname, '.env'));

const PORT = Number(process.env.PORT || 3000);
const APP_ID = process.env.WECHAT_APP_ID || '';
const APP_SECRET = process.env.WECHAT_APP_SECRET || '';
const TOKEN_SECRET = process.env.AUTH_TOKEN_SECRET || '';
const USERS_PATH = path.join(__dirname, 'data', 'users.json');
const APP_STATE_PATH = path.join(__dirname, 'data', 'app-state.json');
const TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60;
const MAX_STATE_BYTES = 128 * 1024;

if (!APP_ID || !APP_SECRET || !TOKEN_SECRET) {
  console.warn('[auth] 缺少微信或令牌配置；请复制 .env.example 为 .env 后填写。');
}

function loadEnv(file) {
  if (!fs.existsSync(file)) return;
  fs.readFileSync(file, 'utf8').split(/\r?\n/).forEach((line) => {
    const text = line.trim();
    if (!text || text.startsWith('#')) return;
    const index = text.indexOf('=');
    if (index < 1) return;
    const key = text.slice(0, index).trim();
    const value = text.slice(index + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  });
}

function json(res, status, body) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS'
  });
  res.end(JSON.stringify(body));
}

function fail(res, status, code, message) {
  json(res, status, { ok: false, error: { code, message } });
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
      if (raw.length > 64 * 1024) reject(new Error('REQUEST_TOO_LARGE'));
    });
    req.on('end', () => {
      try { resolve(raw ? JSON.parse(raw) : {}); } catch (error) { reject(new Error('INVALID_JSON')); }
    });
    req.on('error', reject);
  });
}

function cleanText(value, maxLength) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

function readUsers() {
  try {
    const users = JSON.parse(fs.readFileSync(USERS_PATH, 'utf8'));
    return users && typeof users === 'object' ? users : {};
  } catch (error) {
    return {};
  }
}

function saveUsers(users) {
  fs.mkdirSync(path.dirname(USERS_PATH), { recursive: true });
  const temp = USERS_PATH + '.tmp';
  fs.writeFileSync(temp, JSON.stringify(users, null, 2), { mode: 0o600 });
  fs.renameSync(temp, USERS_PATH);
}

function readAppStates() {
  try {
    const states = JSON.parse(fs.readFileSync(APP_STATE_PATH, 'utf8'));
    return states && typeof states === 'object' ? states : {};
  } catch (error) {
    return {};
  }
}

function saveAppStates(states) {
  fs.mkdirSync(path.dirname(APP_STATE_PATH), { recursive: true });
  const temp = APP_STATE_PATH + '.tmp';
  fs.writeFileSync(temp, JSON.stringify(states, null, 2), { mode: 0o600 });
  fs.renameSync(temp, APP_STATE_PATH);
}

async function wechatJson(url, options) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(url, { ...(options || {}), signal: controller.signal });
    const body = await response.json();
    if (!response.ok || body.errcode) {
      const error = new Error('WECHAT_API_ERROR');
      error.detail = body;
      throw error;
    }
    return body;
  } finally {
    clearTimeout(timeout);
  }
}

async function exchangeLoginCode(code) {
  const url = new URL('https://api.weixin.qq.com/sns/jscode2session');
  url.search = new URLSearchParams({
    appid: APP_ID,
    secret: APP_SECRET,
    js_code: code,
    grant_type: 'authorization_code'
  }).toString();
  return wechatJson(url);
}

async function getAccessToken() {
  const url = new URL('https://api.weixin.qq.com/cgi-bin/token');
  url.search = new URLSearchParams({
    grant_type: 'client_credential',
    appid: APP_ID,
    secret: APP_SECRET
  }).toString();
  return wechatJson(url);
}

async function exchangePhoneCode(code) {
  const access = await getAccessToken();
  const url = 'https://api.weixin.qq.com/wxa/business/getuserphonenumber?access_token=' + encodeURIComponent(access.access_token);
  const result = await wechatJson(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code })
  });
  return result.phone_info;
}

function base64url(value) {
  return Buffer.from(value).toString('base64url');
}

function signToken(payload) {
  const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = base64url(JSON.stringify(payload));
  const signature = crypto.createHmac('sha256', TOKEN_SECRET).update(header + '.' + body).digest('base64url');
  return header + '.' + body + '.' + signature;
}

function verifyToken(token) {
  if (!TOKEN_SECRET || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const signed = parts[0] + '.' + parts[1];
  const expected = crypto.createHmac('sha256', TOKEN_SECRET).update(signed).digest('base64url');
  const actual = parts[2];
  if (actual.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(actual), Buffer.from(expected))) return null;
  try {
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
    if (!payload.sub || !payload.exp || payload.exp <= Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch (error) {
    return null;
  }
}

function getAuthorizedUser(req) {
  const header = String(req.headers.authorization || '');
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  const payload = verifyToken(token);
  if (!payload) return null;
  return readUsers()[payload.sub] || null;
}

function normalizeAppState(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const allowed = ['checkInState', 'childProfile', 'parentRewards', 'familyMeetings', 'meetingTasks', 'classicVisited'];
  const state = {};
  allowed.forEach((key) => {
    if (Object.prototype.hasOwnProperty.call(value, key)) state[key] = value[key];
  });
  try {
    const text = JSON.stringify(state);
    if (Buffer.byteLength(text, 'utf8') > MAX_STATE_BYTES) return null;
    return JSON.parse(text);
  } catch (error) {
    return null;
  }
}

function publicUser(user) {
  return {
    id: user.id,
    nickname: user.nickname,
    avatarUrl: user.avatarUrl,
    phoneNumber: user.phoneNumber,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
}

async function login(req, res) {
  if (!APP_ID || !APP_SECRET || !TOKEN_SECRET) {
    return fail(res, 503, 'AUTH_NOT_CONFIGURED', '服务端尚未配置微信登录凭证');
  }
  let input;
  try { input = await readJson(req); } catch (error) {
    return fail(res, 400, error.message, '请求内容无效');
  }
  const loginCode = cleanText(input.loginCode, 256);
  const phoneCode = cleanText(input.phoneCode, 256);
  if (!loginCode) {
    return fail(res, 400, 'AUTHORIZATION_REQUIRED', '请先完成微信登录授权');
  }
  try {
    const session = await exchangeLoginCode(loginCode);
    const phoneInfo = phoneCode ? await exchangePhoneCode(phoneCode) : null;
    if (!session.openid) {
      return fail(res, 401, 'WECHAT_AUTH_FAILED', '微信授权信息无效或已过期');
    }
    const now = new Date().toISOString();
    const profile = input.profile && typeof input.profile === 'object' ? input.profile : {};
    const users = readUsers();
    const existing = users[session.openid] || { id: session.openid, createdAt: now };
    const user = {
      ...existing,
      id: session.openid,
      unionId: session.unionid || existing.unionId || '',
      nickname: cleanText(profile.nickname, 32) || existing.nickname || '微信用户',
      avatarUrl: cleanText(profile.avatarUrl, 1024) || existing.avatarUrl || '',
      phoneNumber: phoneInfo ? phoneInfo.phoneNumber : (existing.phoneNumber || ''),
      countryCode: phoneInfo ? (phoneInfo.countryCode || '86') : (existing.countryCode || ''),
      updatedAt: now
    };
    users[session.openid] = user;
    saveUsers(users);
    const expiresAt = Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS;
    const token = signToken({ sub: user.id, exp: expiresAt });
    return json(res, 200, { ok: true, token, expiresAt, user: publicUser(user) });
  } catch (error) {
    // 不返回微信原始报错，以免泄露 AppID、请求参数或会话信息。
    // 仅记录网络错误码，用于区分 DNS、TLS 与出口连接问题。
    const networkCode = error && error.cause && error.cause.code;
    console.error('[auth] 微信授权交换失败:', error.message, networkCode ? '(' + networkCode + ')' : '');
    return fail(res, 502, 'WECHAT_AUTH_FAILED', '微信授权失败，请重新授权后再试');
  }
}

function getCurrentUser(req, res) {
  const user = getAuthorizedUser(req);
  if (!user) return fail(res, 401, 'UNAUTHORIZED', '登录已失效，请重新授权');
  return json(res, 200, { ok: true, user: publicUser(user) });
}

function getAppState(req, res) {
  const user = getAuthorizedUser(req);
  if (!user) return fail(res, 401, 'UNAUTHORIZED', '登录已失效，请重新授权');
  const record = readAppStates()[user.id];
  return json(res, 200, {
    ok: true,
    state: record && record.state ? record.state : null,
    updatedAt: record && record.updatedAt ? record.updatedAt : null
  });
}

async function saveAppState(req, res) {
  const user = getAuthorizedUser(req);
  if (!user) return fail(res, 401, 'UNAUTHORIZED', '登录已失效，请重新授权');
  let input;
  try { input = await readJson(req); } catch (error) {
    return fail(res, 400, error.message, '请求内容无效');
  }
  const state = normalizeAppState(input.state);
  if (!state) return fail(res, 400, 'INVALID_APP_STATE', '成长数据格式无效或超过大小限制');
  const states = readAppStates();
  const updatedAt = new Date().toISOString();
  states[user.id] = { state, updatedAt };
  saveAppStates(states);
  return json(res, 200, { ok: true, updatedAt });
}

const server = http.createServer(async (req, res) => {
  if (req.url === '/health' || req.url === '/api/auth/wechat/login') {
    // 只记录方法与路径，避免把登录码、令牌或用户资料写入云托管日志。
    console.log('[request]', req.method, req.url);
  }
  if (req.method === 'OPTIONS') return json(res, 204, {});
  if (req.method === 'POST' && req.url === '/api/auth/wechat/login') return login(req, res);
  if (req.method === 'GET' && req.url === '/api/auth/me') return getCurrentUser(req, res);
  if (req.method === 'GET' && req.url === '/api/app/state') return getAppState(req, res);
  if (req.method === 'PUT' && req.url === '/api/app/state') return saveAppState(req, res);
  if (req.method === 'GET' && req.url === '/health') return json(res, 200, { ok: true });
  return fail(res, 404, 'NOT_FOUND', '接口不存在');
});

server.listen(PORT, () => console.log('[server] listening on :' + PORT));
