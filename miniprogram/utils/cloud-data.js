// 只同步用户产生的数据，不上传 mock 示例内容。云函数由 OPENID 隔离每位用户的数据。
const ENV_ID = 'cloud1-d6gz2xo6tac43e3eb';
const SYNC_FUNCTION = 'userDataSync';
const KEYS = [
  'childProfile', 'checkInState', 'growthAssessment', 'familyMembers', 'familyProfile',
  'familyConvention', 'familyMeetings', 'meetingTasks', 'parentRewards', 'classicVisited'
  , 'reminderReadState'
];

let initialized = false;
let pushTimer = null;

function init() {
  if (initialized || !wx.cloud || !wx.cloud.init) return false;
  try {
    wx.cloud.init({ env: ENV_ID, traceUser: true });
    initialized = true;
    return true;
  } catch (error) { return false; }
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
  if (!init() || !wx.cloud || !wx.cloud.callFunction) return Promise.resolve({ ok: false });
  return new Promise(resolve => {
    wx.cloud.callFunction({
      name: SYNC_FUNCTION,
      data: Object.assign({ action: action }, data || {}),
      success: res => resolve(res && res.result ? res.result : { ok: false }),
      fail: () => resolve({ ok: false })
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

module.exports = { init, pull, push, schedulePush, applySnapshot };
