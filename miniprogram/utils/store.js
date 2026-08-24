// 全局状态读写封装（基于 app.globalData）
// 打卡功能统一入口：今日习惯(daily) + 任务中心(center) 两套打卡，
// 全部持久化到本地存储，跨天自动重置「今日习惯」，积分与历史由 recompute 重建。

const mock = require('./mock.js');

const KEY = 'checkInState';
// 基准积分 = mock 默认积分 减去 默认已完成的今日任务积分，
// 这样首次启动播种默认打卡后重建出来的总分仍等于原 mock 值（1280），避免重复累加。
const DEFAULT_DONE_POINTS = mock.todayTasks.filter(t => t.done).reduce((s, t) => s + t.points, 0);
const BASE_POINTS = mock.child.points - DEFAULT_DONE_POINTS;

// 任务中心扁平表：id -> { points(奖励总和), dim, name }
const centerMap = {};
mock.tasks.forEach(g => {
  g.list.forEach(t => {
    centerMap[t.id] = {
      points: t.rewards.reduce((s, r) => s + r.points, 0),
      dim: g.dim,
      name: t.name
    };
  });
});

function state() {
  return getApp().globalData;
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
  if (!st.redeemed) st.redeemed = [];
  // 跨天：清空「今日习惯」打卡（任务中心为累积行为，保留）
  if (st.date !== today) {
    st.date = today;
    st.daily = {};
  }
  return st;
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
    if (m) {
      pts += m.points;
      hist.push({ title: m.name, dim: m.dim, date: st.center[id], delta: m.points });
    }
  });
  (st.redeemed || []).forEach(r => {
    pts -= r.cost;
    hist.push({ title: '兑换：' + r.name, dim: 'taste', date: r.date, delta: -r.cost });
  });
  hist.sort((a, b) => b.date.localeCompare(a.date));
  s.child.points = pts;
  s.pointsHistory = hist;
}

// 在 app.js onLaunch 中调用：恢复打卡状态 + 重建积分/历史
function initCheckIns() {
  const s = state();
  const st = load();
  s.todayTasks.forEach(t => { t.done = !!st.daily[t.id]; });
  s.centerTasksDone = {};
  Object.keys(st.center).forEach(id => { s.centerTasksDone[id] = st.center[id]; });
  recompute(s, st);
  s._ci = st;
}

// ---------- 打卡 ----------

function toggleDaily(index) {
  const s = state();
  const t = s.todayTasks[index];
  if (!t) return null;
  const was = t.done;
  t.done = !t.done;
  const st = s._ci;
  if (t.done) st.daily[t.id] = formatToday(); else delete st.daily[t.id];
  recompute(s, st);
  save(st);
  return { done: t.done, delta: t.done ? t.points : -t.points };
}

function toggleCenter(id) {
  const s = state();
  const m = centerMap[id];
  if (!m) return null;
  const done = !s.centerTasksDone[id];
  if (done) s.centerTasksDone[id] = formatToday(); else delete s.centerTasksDone[id];
  const st = s._ci;
  if (done) st.center[id] = formatToday(); else delete st.center[id];
  recompute(s, st);
  save(st);
  return { done: done, delta: done ? m.points : -m.points };
}

// ---------- 查询 ----------

function todayDoneCount() {
  return state().todayTasks.filter(t => t.done).length;
}

function todayGain() {
  return state().todayTasks.filter(t => t.done).reduce((s, t) => s + t.points, 0);
}

// ---------- 兑换 / 签约 / 奖励 ----------

function redeem(reward) {
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

function signContract() {
  const s = state();
  s.signed = true;
  wx.setStorageSync('signed', true);
}

function isSigned() {
  return state().signed;
}

// 保留旧接口（仅累加，不持久化），避免其它页面报错
function recordBonus(name, points) {
  const s = state();
  s.child.points += points;
  s.pointsHistory.unshift({ title: name, dim: 'habit', date: formatToday(), delta: points });
  return { points: s.child.points };
}

module.exports = {
  state, dimMeta, initCheckIns,
  toggleDaily, toggleCenter, toggleTodayTask: toggleDaily,
  todayDoneCount, todayGain,
  redeem, signContract, isSigned, recordBonus
};
