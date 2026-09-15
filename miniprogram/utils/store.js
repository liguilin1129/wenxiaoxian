// 全局状态读写封装（基于 app.globalData）
// 打卡功能统一入口：今日习惯(daily) + 任务中心(center) 两套打卡，
// 全部持久化到本地存储，跨天自动重置「今日习惯」，积分与历史由 recompute 重建。

const mock = require('./mock.js');

const KEY = 'checkInState';
// 基准积分 = mock 默认积分 减去 默认已完成的今日任务积分，
// 这样首次启动播种默认打卡后重建出来的总分仍等于原 mock 值（1280），避免重复累加。
const DEFAULT_DONE_POINTS = mock.todayTasks.filter(t => t.done).reduce((s, t) => s + t.points, 0);
const BASE_POINTS = mock.child.points - DEFAULT_DONE_POINTS;

const MEETINGS_KEY = 'familyMeetings';
const MEETING_TASKS_KEY = 'meetingTasks'; // 今日任务中来自会议的新增项
const FAMILY_MEMBERS_KEY = 'familyMembers';
const FAMILY_CONVENTION_KEY = 'familyConvention';

// 任务中心扁平表：id -> { points(奖励总和), dim, name }
const centerMap = {};
mock.tasks.forEach(g => {
  g.list.forEach(t => {
    centerMap[t.id] = {
      points: t.rewards.reduce((s, r) => s + r.points, 0),
      dim: g.dim,
      name: t.name,
      rewards: t.rewards
    };
  });
});

// app 实例缓存：onLaunch 阶段 getApp() 可能尚未就绪，
// 用 this 注入后缓存下来，后续页面里 getApp() 正常时也照常刷新。
let _app = null;
function state() {
  if (_app) return _app.globalData;
  const app = getApp();
  if (app) { _app = app; return app.globalData; }
  return {};
}

function dimMeta(key) {
  return state().dimensions.find(d => d.key === key) || { name: key, color: '#6366F1', bg: '#EEEDFE', dark: '#4F46E5' };
}

function todayStr() {
  const d = new Date();
  return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
}

function formatToday() {
  const d = new Date();
  const m = ('0' + (d.getMonth() + 1)).slice(-2);
  const day = ('0' + d.getDate()).slice(-2);
  return m + '-' + day;
}

function load() {
  let st = wx.getStorageSync(KEY);
  const today = todayStr();
  if (!st || typeof st !== 'object') {
    // 首次启动：沿用 mock 默认「今日已完成 3 项」作为初始打卡状态
    st = { date: today, daily: {}, center: {}, redeemed: [] };
    mock.todayTasks.forEach(t => { if (t.done) st.daily[t.id] = formatToday(); });
  }
  if (!st.daily) st.daily = {};
  if (!st.center) st.center = {};
  // 兼容旧版本以日期字符串保存的任务中心打卡：它们视为已确认。
  Object.keys(st.center).forEach((id) => {
    if (typeof st.center[id] === 'string') st.center[id] = { status: 'approved', date: st.center[id] };
  });
  if (!st.redeemed) st.redeemed = [];
  if (!st.aiRecords) st.aiRecords = [];
  if (!st.aiCheckins) st.aiCheckins = [];
  // 跨天：清空「今日习惯」打卡（任务中心为累积行为，保留）
  if (st.date !== today) {
    st.date = today;
    st.daily = {};
  }
  return st;
}

function loadMeetings() {
  const list = wx.getStorageSync(MEETINGS_KEY);
  return Array.isArray(list) ? list : [];
}

function saveMeetings(list) {
  wx.setStorageSync(MEETINGS_KEY, list);
}

function loadMeetingTasks() {
  const list = wx.getStorageSync(MEETING_TASKS_KEY);
  return Array.isArray(list) ? list : [];
}

function saveMeetingTasks(list) {
  wx.setStorageSync(MEETING_TASKS_KEY, list);
}

function defaultFamilyMembers() {
  const child = state().child || {};
  return [
    { id: 'father', name: '爸爸', role: '家长', avatar: '爸', bg: '#EEF2FF', color: '#4338CA' },
    { id: 'mother', name: '妈妈', role: '家长', avatar: '妈', bg: '#FFF1F3', color: '#E11D6F' },
    { id: 'child', name: child.name || '文小贤', role: '孩子', avatar: (child.name || '贤').slice(0, 1), bg: '#ECFDF5', color: '#0F9D6B' }
  ];
}

function getFamilyMembers() {
  const list = wx.getStorageSync(FAMILY_MEMBERS_KEY);
  return Array.isArray(list) && list.length ? list : defaultFamilyMembers();
}

function saveFamilyMembers(list) {
  wx.setStorageSync(FAMILY_MEMBERS_KEY, list);
}

function updateFamilyMember(member) {
  const list = getFamilyMembers();
  const index = list.findIndex(item => item.id === member.id);
  if (index < 0) return false;
  const name = typeof member.name === 'string' ? member.name.trim().slice(0, 12) : '';
  if (!name) return false;
  list[index] = Object.assign({}, list[index], { name: name, role: member.role === '孩子' ? '孩子' : '家长', avatar: name.slice(0, 1) });
  saveFamilyMembers(list);
  return true;
}

function addFamilyMember(member) {
  const name = typeof member.name === 'string' ? member.name.trim().slice(0, 12) : '';
  if (!name) return null;
  const role = member.role === '孩子' ? '孩子' : '家长';
  const palette = role === '孩子'
    ? { bg: '#ECFDF5', color: '#0F9D6B' }
    : { bg: '#EEF2FF', color: '#4338CA' };
  const list = getFamilyMembers();
  const created = { id: 'member_' + Date.now(), name: name, role: role, avatar: name.slice(0, 1), bg: palette.bg, color: palette.color };
  list.push(created);
  saveFamilyMembers(list);
  return created;
}

function removeFamilyMember(id) {
  const list = getFamilyMembers();
  if (list.length <= 1) return { ok: false, reason: 'LAST_MEMBER' };
  const index = list.findIndex(item => item.id === id);
  if (index < 0) return { ok: false, reason: 'NOT_FOUND' };
  list.splice(index, 1);
  saveFamilyMembers(list);
  return { ok: true };
}

function getFamilyConvention() {
  const saved = wx.getStorageSync(FAMILY_CONVENTION_KEY);
  return saved && typeof saved === 'object' ? saved : { title: '文小贤家的成长公约', content: '', updatedAt: '' };
}

function saveFamilyConvention(convention) {
  const title = typeof convention.title === 'string' ? convention.title.trim().slice(0, 24) : '';
  const content = typeof convention.content === 'string' ? convention.content.trim().slice(0, 1000) : '';
  const data = { title: title || '文小贤家的成长公约', content: content, updatedAt: formatToday() };
  wx.setStorageSync(FAMILY_CONVENTION_KEY, data);
  return data;
}

function save(st) {
  wx.setStorageSync(KEY, st);
}

// 由持久化状态确定性重建积分与历史，避免累计漂移
function recompute(s, st) {
  let pts = BASE_POINTS;
  const hist = [];
  s.todayTasks.forEach(t => {
    if (st.daily[t.id]) {
      pts += t.points;
      hist.push({ title: t.name, dim: t.dim, date: st.daily[t.id], delta: t.points });
    }
  });
  Object.keys(st.center).forEach(id => {
    const m = centerMap[id];
    const record = st.center[id];
    if (m && record && record.status === 'approved') {
      pts += m.points;
      hist.push({ title: m.name, dim: m.dim, date: record.date, delta: m.points });
    }
  });
  (st.redeemed || []).forEach(r => {
    pts -= r.cost;
    hist.push({ title: '兑换：' + r.name, dim: 'taste', date: r.date, delta: -r.cost });
  });
  (st.aiRecords || []).forEach(r => {
    pts += r.points;
    hist.push({ title: 'AI记录：' + r.name, dim: 'habit', date: r.date, delta: r.points });
  });
  hist.sort((a, b) => b.date.localeCompare(a.date));
  s.child.points = pts;
  s.pointsHistory = hist;
}

// 在 app.js onLaunch 中调用：恢复打卡状态 + 重建积分/历史。
// 必须传入 app 实例（this），因为 onLaunch 阶段 getApp() 尚未就绪。
function initCheckIns(appInstance) {
  const s = (appInstance && appInstance.globalData) ? appInstance.globalData : state();
  _app = getApp() || appInstance || null;
  const st = load();
  s.todayTasks.forEach(t => { t.done = !!st.daily[t.id]; });
  s.centerTasksDone = {};
  s.centerTaskStatus = {};
  Object.keys(st.center).forEach(id => {
    const record = st.center[id];
    if (!record) return;
    s.centerTaskStatus[id] = record.status;
    if (record.status === 'approved') s.centerTasksDone[id] = record.date;
  });
  s._ci = st;
  // 恢复家庭会议列表
  s.meetings = loadMeetings();
  // 恢复由会议新增的今日任务（跨天时只保留非过期的会议任务，简单策略：全部清空重按日期重建）
  const today = todayStr();
  const mtList = loadMeetingTasks();
  const validMt = mtList.filter(t => t.date === today);
  validMt.forEach(t => {
    const exists = s.todayTasks.find(x => x.id === t.id);
    if (!exists) s.todayTasks.push(t);
  });
  if (validMt.length !== mtList.length) saveMeetingTasks(validMt);

  // 恢复 AI 创建的当天打卡项；旧日记录仍保留在打卡历史和积分流水中。
  s.todayTasks = s.todayTasks.filter(t => !t.fromAiCheckin);
  (st.aiCheckins || []).filter(item => item.date === formatToday()).forEach(item => {
    s.todayTasks.push({
      id: item.id,
      name: item.name,
      dim: 'habit',
      points: item.points,
      done: true,
      fromAiCheckin: true
    });
  });
  recompute(s, st);
}

// 自愈：开发者工具热重载 app.js 时 onLaunch 不一定重跑，
// 首次打卡/兑换前若发现状态未初始化，则惰性初始化一次，避免访问 undefined。
function ensure() {
  const s = state();
  if (!s._ci || !s.centerTasksDone) initCheckIns();
}

// ---------- 打卡 ----------

function toggleDaily(index) {
  ensure();
  const s = state();
  const t = s.todayTasks[index];
  if (!t) return null;
  if (t.fromAiCheckin) return { locked: true, done: true, delta: 0 };
  const was = t.done;
  t.done = !t.done;
  const st = s._ci;
  if (t.done) st.daily[t.id] = formatToday(); else delete st.daily[t.id];
  recompute(s, st);
  save(st);
  return { done: t.done, delta: t.done ? t.points : -t.points };
}

function toggleCenter(id) {
  ensure();
  const s = state();
  const m = centerMap[id];
  if (!m) return null;
  const done = !s.centerTasksDone[id];
  if (done) {
    s.centerTasksDone[id] = formatToday();
    s.centerTaskStatus[id] = 'approved';
    s._ci.center[id] = { status: 'approved', date: formatToday() };
  } else {
    delete s.centerTasksDone[id];
    delete s.centerTaskStatus[id];
    delete s._ci.center[id];
  }
  const st = s._ci;
  recompute(s, st);
  save(st);
  return { done: done, delta: done ? m.points : -m.points };
}

// ---------- 查询 ----------

// 任务中心任务是否已打卡（读取持久化状态，含懒初始化自愈）
function isCenterDone(id) {
  ensure();
  return !!state().centerTasksDone[id];
}

function getCenterStatus(id) {
  ensure();
  return state().centerTaskStatus[id] || 'todo';
}

function submitCenter(id) {
  ensure();
  const s = state();
  if (!centerMap[id]) return null;
  const status = getCenterStatus(id);
  if (status !== 'todo') return { status: status, changed: false };
  const record = { status: 'pending', date: formatToday() };
  s._ci.center[id] = record;
  s.centerTaskStatus[id] = record.status;
  save(s._ci);
  return { status: record.status, changed: true };
}

function approveCenter(id) {
  ensure();
  const s = state();
  const record = s._ci.center[id];
  if (!record || record.status !== 'pending') return null;
  record.status = 'approved';
  s.centerTaskStatus[id] = 'approved';
  s.centerTasksDone[id] = record.date;
  recompute(s, s._ci);
  save(s._ci);
  return { points: centerMap[id].points, status: 'approved' };
}

function rejectCenter(id) {
  ensure();
  const s = state();
  const record = s._ci.center[id];
  if (!record || record.status !== 'pending') return false;
  delete s._ci.center[id];
  delete s.centerTaskStatus[id];
  save(s._ci);
  return true;
}

function getPendingApprovals() {
  ensure();
  const s = state();
  return Object.keys(s._ci.center)
    .filter(id => s._ci.center[id] && s._ci.center[id].status === 'pending' && centerMap[id])
    .map(id => ({
      id: id,
      name: centerMap[id].name,
      dim: centerMap[id].dim,
      points: centerMap[id].points,
      rewards: centerMap[id].rewards,
      date: s._ci.center[id].date
    }));
}

function todayDoneCount() {
  return state().todayTasks.filter(t => t.done).length;
}

function todayGain() {
  return state().todayTasks.filter(t => t.done).reduce((s, t) => s + t.points, 0);
}

// ---------- 荣誉墙 / 勋章 ----------
function getBadges() {
  ensure();
  const s = state();
  const completed = (s.pointsHistory || []).filter(item => item.delta > 0);
  const taskCount = completed.length;
  const readCount = (s.classics || []).reduce((sum, item) => sum + (Number(item.read) || 0), 0);
  const points = Number((s.child || {}).points) || 0;
  const streak = Number((s.child || {}).streak) || 0;
  const dims = s.dimensions || [];
  const allRound = dims.length > 0 && dims.every(item => Number(item.pct) >= 80);
  const defs = [
    { id: 'first-checkin', name: '打卡新星', icon: '🌟', desc: '完成第 1 次任务打卡', value: taskCount, target: 1, unit: '次打卡' },
    { id: 'habit-master', name: '好习惯王', icon: '🌱', desc: '累计完成 7 次任务打卡', value: taskCount, target: 7, unit: '次打卡' },
    { id: 'reading-star', name: '诵读小达人', icon: '📖', desc: '累计诵读经典 10 章', value: readCount, target: 10, unit: '章' },
    { id: 'points-rookie', name: '积分达人', icon: '⭐', desc: '成长积分达到 500 分', value: points, target: 500, unit: '分' },
    { id: 'persistence', name: '坚持不懈', icon: '🔥', desc: '连续打卡 7 天', value: streak, target: 7, unit: '天' },
    { id: 'task-champion', name: '任务冠军', icon: '🏅', desc: '累计完成 50 次任务打卡', value: taskCount, target: 50, unit: '次打卡' },
    { id: 'all-round', name: '全能少年', icon: '👑', desc: '四维成长均达到 80%', value: allRound ? 80 : Math.min.apply(null, dims.map(item => Number(item.pct) || 0)), target: 80, unit: '%' }
  ];
  return defs.map(item => {
    const value = Math.max(0, Number(item.value) || 0);
    return Object.assign({}, item, { got: value >= item.target, progress: Math.min(100, Math.round(value / item.target * 100)), displayValue: Math.min(value, item.target) });
  });
}

// ---------- 兑换 / 签约 / 奖励 ----------

function redeem(reward) {
  ensure();
  const s = state();
  const have = s.child.points;
  if (have < reward.cost) {
    return { ok: false, msg: '积分不足，还差 ' + (reward.cost - have) + ' 分' };
  }
  const st = s._ci;
  if (!st.redeemed) st.redeemed = [];
  st.redeemed.push({ name: reward.name, cost: reward.cost, date: formatToday() });
  recompute(s, st);
  save(st);
  return { ok: true, points: s.child.points };
}

// 家长自定义奖品：整张列表持久化（覆盖 mock 默认值）
const REWARDS_KEY = 'parentRewards';
function getRewards() {
  const s = state();
  return s.rewards || [];
}
function saveRewards(list) {
  const s = state();
  s.rewards = list;
  wx.setStorageSync(REWARDS_KEY, list);
}

// 轻量登录：仅标记已登录，与家庭会议解耦
function login() {
  const s = state();
  s.signed = true;
  wx.setStorageSync('signed', true);
}

function isSigned() {
  return state().signed;
}

// AI 打卡：一份数据同步生成「今日已完成」「历史记录」和积分流水，重启不丢。
function aiRecordBonus(name, points) {
  ensure();
  const s = state();
  const st = s._ci;
  const safeName = String(name || '').trim().slice(0, 24);
  const safePoints = Number(points);
  if (!safeName || !Number.isInteger(safePoints) || safePoints < 1 || safePoints > 1000) return null;
  if (!st.aiRecords) st.aiRecords = [];
  if (!st.aiCheckins) st.aiCheckins = [];
  const checkin = {
    id: 'ai_checkin_' + Date.now(),
    name: safeName,
    points: safePoints,
    date: formatToday()
  };
  st.aiRecords.push({ name: safeName, points: safePoints, date: checkin.date });
  st.aiCheckins.unshift(checkin);
  s.todayTasks.push({
    id: checkin.id,
    name: safeName,
    dim: 'habit',
    points: safePoints,
    done: true,
    fromAiCheckin: true
  });
  recompute(s, st);
  save(st);
  return { points: s.child.points };
}

function getAiCheckinRecords(limit) {
  ensure();
  const max = Number(limit) || 10;
  return (state()._ci.aiCheckins || []).slice(0, max).map(item => Object.assign({}, item));
}

// AI 添加今日任务（仅当前会话有效，原型阶段）
function addDailyTask(name, points, dim) {
  ensure();
  const s = state();
  const id = 'ai_' + Date.now();
  const task = { id: id, name: name, dim: dim || 'habit', points: points || 5, done: false };
  s.todayTasks.push(task);
  return task;
}

// 保留旧接口（仅累加，不持久化），避免其它页面报错
function recordBonus(name, points) {
  const s = state();
  s.child.points += points;
  s.pointsHistory.unshift({ title: name, dim: 'habit', date: formatToday(), delta: points });
  return { points: s.child.points };
}

// ---------- 家庭会议 ----------

function getMeetings() {
  ensure();
  const s = state();
  if (!s.meetings) s.meetings = loadMeetings();
  return s.meetings;
}

function syncMeetingsToStorage() {
  const s = state();
  if (s.meetings) saveMeetings(s.meetings);
}

function createMeeting(meeting) {
  ensure();
  const s = state();
  if (!s.meetings) s.meetings = loadMeetings();
  s.meetings.unshift(meeting);
  syncMeetingsToStorage();
  return meeting;
}

function updateMeeting(meeting) {
  ensure();
  const s = state();
  if (!s.meetings) s.meetings = loadMeetings();
  const idx = s.meetings.findIndex(m => m.id === meeting.id);
  if (idx >= 0) {
    s.meetings[idx] = meeting;
    syncMeetingsToStorage();
    return true;
  }
  return false;
}

function closeMeeting(id, summary) {
  ensure();
  const s = state();
  if (!s.meetings) s.meetings = loadMeetings();
  const meeting = s.meetings.find(m => m.id === id);
  if (!meeting || meeting.status === 'done') return false;

  const today = todayStr();
  const todayShort = formatToday();
  const mtList = loadMeetingTasks();

  meeting.status = 'done';
  meeting.summary = summary || '';

  meeting.topics.forEach(t => {
    if (!t.approved) return;
    const pts = Number(t.target.points) || 0;
    if (t.type === 'task' && t.target.name) {
      const task = {
        id: 'mt_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
        name: t.target.name,
        dim: 'habit',
        points: pts || 5,
        done: false,
        fromMeeting: true
      };
      s.todayTasks.push(task);
      mtList.push(Object.assign({}, task, { date: today }));
    } else if (t.type === 'reward' && t.target.name) {
      const reward = {
        id: 'mr_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
        name: t.target.name,
        desc: '家庭会议新增心愿',
        cost: pts || 50,
        dim: 'taste',
        fromMeeting: true
      };
      s.rewards.push(reward);
      // 同步家长自定义奖品存储
      wx.setStorageSync(REWARDS_KEY, s.rewards);
    } else if (t.type === 'rule' && t.target.name) {
      // 积分规则调整：仅作为历史记录，暂不改动全局权重
      s.pointsHistory.unshift({
        title: '会议规则：' + t.target.name,
        dim: 'habit',
        date: todayShort,
        delta: 0
      });
    }
  });

  saveMeetingTasks(mtList);
  syncMeetingsToStorage();
  return true;
}

// ---------- 学员案例点赞/收藏 ----------

const CASE_LIKE_KEY = 'caseLikes';
const CASE_FAV_KEY = 'caseFavs';

function getCaseSet(key) {
  const raw = wx.getStorageSync(key);
  return new Set(Array.isArray(raw) ? raw : []);
}
function saveCaseSet(key, set) {
  wx.setStorageSync(key, Array.from(set));
}

function isCaseLiked(id) {
  return getCaseSet(CASE_LIKE_KEY).has(id);
}
function isCaseFaved(id) {
  return getCaseSet(CASE_FAV_KEY).has(id);
}
function toggleCaseLike(id) {
  const set = getCaseSet(CASE_LIKE_KEY);
  if (set.has(id)) set.delete(id); else set.add(id);
  saveCaseSet(CASE_LIKE_KEY, set);
}
function toggleCaseFav(id) {
  const set = getCaseSet(CASE_FAV_KEY);
  if (set.has(id)) set.delete(id); else set.add(id);
  saveCaseSet(CASE_FAV_KEY, set);
}

module.exports = {
  state, dimMeta, initCheckIns,
  toggleDaily, toggleCenter, toggleTodayTask: toggleDaily,
  isCenterDone, getCenterStatus, submitCenter, approveCenter, rejectCenter, getPendingApprovals, todayDoneCount, todayGain,
  getBadges,
  redeem, login, isSigned, recordBonus,
  aiRecordBonus, getAiCheckinRecords, addDailyTask,
  getRewards, saveRewards,
  getMeetings, createMeeting, updateMeeting, closeMeeting,
  getFamilyMembers, updateFamilyMember, addFamilyMember, removeFamilyMember, getFamilyConvention, saveFamilyConvention,
  isCaseLiked, isCaseFaved, toggleCaseLike, toggleCaseFav
};
