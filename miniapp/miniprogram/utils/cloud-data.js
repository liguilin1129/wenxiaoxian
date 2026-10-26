// 只同步用户产生的数据，不上传 mock 示例内容。云函数由 OPENID 隔离每位用户的数据。
const ENV_ID = 'cloud1-d6gz2xo6tac43e3eb';
const SYNC_FUNCTION = 'userDataSync';
const KEYS = [
  'childProfile', 'checkInState', 'growthAssessment', 'growthAssessmentHistory', 'familyMembers', 'familyProfile',
  'familyConvention', 'familyMeetings', 'meetingTasks', 'parentRewards', 'classicVisited'
  , 'reminderReadState', 'communityUserPosts', 'communityUserArticles'
];

let initialized = false;
let pushTimer = null;
let lastError = null;

function init() {
  // 已初始化后后续调用应复用成功状态，而不是被误判为不可用。
  if (initialized) return true;
  if (!wx.cloud || !wx.cloud.init) return false;
  try {
    wx.cloud.init({ env: ENV_ID, traceUser: true });
    initialized = true;
    return true;
  } catch (error) {
    console.error('[cloud-data] 云开发初始化失败', error);
    return false;
  }
}

function snapshot() {
  const data = {};
  KEYS.forEach(key => {
    const value = wx.getStorageSync(key);
    if (value !== undefined && value !== '') data[key] = value;
  });
  return data;
}

function call(action, data) {
  if (!init() || !wx.cloud || !wx.cloud.callFunction) {
    lastError = { code: 'CLOUD_UNAVAILABLE', message: '云开发初始化失败' };
    console.error('[cloud-data]', lastError);
    return Promise.resolve({ ok: false, error: lastError });
  }
  return new Promise(resolve => {
    wx.cloud.callFunction({
      name: SYNC_FUNCTION,
      data: Object.assign({ action: action }, data || {}),
      success: res => {
        const result = res && res.result ? res.result : { ok: false, error: { code: 'EMPTY_RESPONSE', message: '云函数没有返回结果' } };
        if (!result.ok) {
          lastError = result.error || { code: 'SYNC_FAILED', message: '云端同步失败' };
          console.error('[cloud-data] ' + action + ' failed:', lastError);
        } else {
          lastError = null;
        }
        resolve(result);
      },
      fail: error => {
        lastError = {
          code: 'FUNCTION_CALL_FAILED',
          message: String((error && error.errMsg) || '调用 userDataSync 失败')
        };
        console.error('[cloud-data] ' + action + ' failed:', lastError);
        resolve({ ok: false, error: lastError });
      }
    });
  });
}

function applySnapshot(data) {
  if (!data || typeof data !== 'object') return false;
  KEYS.forEach(key => {
    if (Object.prototype.hasOwnProperty.call(data, key)) wx.setStorageSync(key, data[key]);
  });
  return true;
}

async function pull() {
  const result = await call('get');
  if (!result.ok || !result.data) return false;
  return applySnapshot(result.data);
}

async function push() {
  const data = snapshot();
  if (!Object.keys(data).length) return false;
  const result = await call('save', { snapshot: data });
  return !!result.ok;
}

function schedulePush() {
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(() => { pushTimer = null; push(); }, 1200);
}

function getLastError() { return lastError; }

module.exports = { init, pull, push, schedulePush, applySnapshot, getLastError };
