// 全局状态读写封装（基于 app.globalData）
function state() {
  return getApp().globalData;
}

function dimMeta(key) {
  return state().dimensions.find(d => d.key === key) || { name: key, color: '#6366F1', bg: '#EEEDFE', dark: '#4F46E5' };
}

function todayDoneCount() {
  return state().todayTasks.filter(t => t.done).length;
}

function todayGain() {
  return state().todayTasks.filter(t => t.done).reduce((s, t) => s + t.points, 0);
}

function toggleTodayTask(index) {
  const t = state().todayTasks[index];
  if (!t) return;
  const wasDone = t.done;
  t.done = !t.done;
  const delta = wasDone ? -t.points : t.points;
  const s = state();
  s.child.points += delta;
  s.pointsHistory.unshift({
    title: t.name,
    dim: t.dim,
    date: formatToday(),
    delta: delta
  });
  return { done: t.done, points: s.child.points, delta: delta };
}

function redeem(reward) {
  const s = state();
  if (s.child.points < reward.cost) {
    return { ok: false, msg: '积分不足，还差 ' + (reward.cost - s.child.points) + ' 分' };
  }
  s.child.points -= reward.cost;
  s.pointsHistory.unshift({
    title: '兑换：' + reward.name,
    dim: 'taste',
    date: formatToday(),
    delta: -reward.cost
  });
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

function formatToday() {
  const d = new Date();
  const m = ('0' + (d.getMonth() + 1)).slice(-2);
  const day = ('0' + d.getDate()).slice(-2);
  return m + '-' + day;
}

module.exports = {
  state, dimMeta, todayDoneCount, todayGain, toggleTodayTask, redeem, signContract, isSigned
};
