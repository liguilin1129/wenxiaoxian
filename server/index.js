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
const TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60;

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
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
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

async function wechatJson(url, options) {
  const response = await fetch(url, options);
  const body = await response.json();
  if (!response.ok || body.errcode) {
    const error = new Error('WECHAT_API_ERROR');
    error.detail = body;
    throw error;
  }
  return body;
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
  if (!loginCode || !phoneCode) {
    return fail(res, 400, 'AUTHORIZATION_REQUIRED', '请先完成微信登录与手机号授权');
  }
  try {
    const [session, phoneInfo] = await Promise.all([exchangeLoginCode(loginCode), exchangePhoneCode(phoneCode)]);
    if (!session.openid || !phoneInfo || !phoneInfo.phoneNumber) {
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
      phoneNumber: phoneInfo.phoneNumber,
      countryCode: phoneInfo.countryCode || '86',
      updatedAt: now
    };
    users[session.openid] = user;
    saveUsers(users);
    const expiresAt = Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS;
    const token = signToken({ sub: user.id, exp: expiresAt });
    return json(res, 200, { ok: true, token, expiresAt, user: publicUser(user) });
  } catch (error) {
    // 不返回微信原始报错，以免泄露 AppID、请求参数或会话信息。
    console.error('[auth] 微信授权交换失败:', error.message);
    return fail(res, 502, 'WECHAT_AUTH_FAILED', '微信授权失败，请重新授权后再试');
  }
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') return json(res, 204, {});
  if (req.method === 'POST' && req.url === '/api/auth/wechat/login') return login(req, res);
  if (req.method === 'GET' && req.url === '/health') return json(res, 200, { ok: true });
  return fail(res, 404, 'NOT_FOUND', '接口不存在');
});

server.listen(PORT, () => console.log('[server] listening on :' + PORT));
