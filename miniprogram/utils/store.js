// 全局状态读写封装（基于 app.globalData）
// 打卡功能统一入口：今日习惯(daily) + 任务中心(center) 两套打卡，
// 全部持久化到本地存储，跨天自动重置「今日习惯」，积分与历史由 recompute 重建。

const mock = require('./mock.js');
const cloudData = require('./cloud-data.js');

const KEY = 'checkInState';
// 基准积分 = mock 默认积分 减去 默认已完成的今日任务积分，
// 这样首次启动播种默认打卡后重建出来的总分仍等于原 mock 值（1280），避免重复累加。
const DEFAULT_DONE_POINTS = mock.todayTasks.filter(t => t.done).reduce((s, t) => s + t.points, 0);
const BASE_POINTS = mock.child.points - DEFAULT_DONE_POINTS;
const DIMENSION_BASELINES = mock.dimensions.reduce((result, item) => { result[item.key] = Number(item.pct) || 0; return result; }, {});
const DIMENSION_MULTIPLIERS = { heart: 2, body: 1.5, habit: 1.3, taste: 1 };

const MEETINGS_KEY = 'familyMeetings';
const MEETING_TASKS_KEY = 'meetingTasks'; // 今日任务中来自会议的新增项
const FAMILY_MEMBERS_KEY = 'familyMembers';
const FAMILY_CONVENTION_KEY = 'familyConvention';
const FAMILY_PROFILE_KEY = 'familyProfile';
const ASSESSMENT_KEY = 'growthAssessment';
const REMINDER_READ_KEY = 'reminderReadState';
const GROWTH_GOALS_KEY = 'localGrowthGoals';
const APP_MODE_KEY = 'localAppMode';
const LOCAL_DATA_VERSION_KEY = 'localDataVersion';
const LEVELS = [{ level: 1, name: '成长新芽', exp: 0 }, { level: 2, name: '习惯幼苗', exp: 200 }, { level: 3, name: '自律新星', exp: 600 }, { level: 4, name: '成长先锋', exp: 1200 }, { level: 5, name: '少年榜样', exp: 2000 }, { level: 6, name: '习惯大师', exp: 3200 }, { level: 7, name: '成长领航员', exp: 4800 }, { level: 8, name: '卓越少年', exp: 7000 }];

const GROWTH_GOAL_TEMPLATES = {
  heart: { name: '情绪与关怀', desc: '练习表达感受、理解他人和遵守家庭约定。', stages: [{ name: '每天说出一种感受', points: 5, target: 3 }, { name: '遇到不开心时先停一停再表达', points: 8, target: 5 }, { name: '主动关心一位家人', points: 10, target: 7 }] },
  body: { name: '规律作息与运动', desc: '从小运动和规律生活开始，建立身体好习惯。', stages: [{ name: '完成 20 分钟户外运动', points: 8, target: 3 }, { name: '按约定时间准备睡觉', points: 6, target: 5 }, { name: '一周完成 5 次运动打卡', points: 10, target: 5 }] },
  habit: { name: '自律与整理', desc: '从完成一件小事开始，练习计划和整理。', stages: [{ name: '完成后整理自己的物品', points: 5, target: 3 }, { name: '按约定完成当天任务', points: 8, target: 5 }, { name: '独立整理一次书包或学习区', points: 10, target: 7 }] },
  taste: { name: '阅读与创造', desc: '通过阅读、表达和创作积累好品味。', stages: [{ name: '阅读或听故事 15 分钟', points: 8, target: 3 }, { name: '分享一个新发现', points: 6, target: 5 }, { name: '完成一次小创作或手工', points: 10, target: 5 }] }
};

const ASSESSMENT_LEVELS = [
  { min: 90, name: '成长榜样', note: '四维习惯表现稳定，可以尝试更有挑战的成长目标。' },
  { min: 75, name: '自律能手', note: '已经形成不少好习惯，保持节奏就会越来越棒。' },
  { min: 60, name: '习惯小达人', note: '正在稳步成长，选择一两个重点持续练习。' },
  { min: 40, name: '探索幼苗', note: '每一次小行动都很重要，从容易做到的目标开始。' },
  { min: 0, name: '成长新芽', note: '成长刚刚开始，和家长一起发现适合自己的节奏。' }
];

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

// 任务备注、名称等用户输入统一清理，避免空值和超长文本进入本地/云端记录。
function cleanText(value, maxLength) {
  if (typeof value !== 'string') return '';
  return value.replace(/\s+/g, ' ').trim().slice(0, Number(maxLength) || 0);
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
  if (!st.customTasks) st.customTasks = [];
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
  cloudData.schedulePush();
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
  cloudData.schedulePush();
}

// 家庭资料独立保存。现阶段使用本地存储承载「家长代管」，
// 后续接入云数据库时可按 familyId / inviteCode 原样迁移为跨账号家庭。
function createInviteCode() {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
  return code;
}

function getFamilyProfile() {
  const saved = wx.getStorageSync(FAMILY_PROFILE_KEY);
  if (saved && typeof saved === 'object' && saved.inviteCode) return saved;
  const members = getFamilyMembers();
  const child = members.find(item => item.role === '孩子') || {};
  const profile = {
    familyId: 'local_family_' + Date.now(),
    name: (child.name || '文小贤') + '的成长家庭',
    mode: 'parent_managed',
    inviteCode: createInviteCode(),
    createdAt: todayStr(),
    updatedAt: todayStr()
  };
  wx.setStorageSync(FAMILY_PROFILE_KEY, profile);
  cloudData.schedulePush();
  return profile;
}

function refreshFamilyInviteCode() {
  const profile = Object.assign({}, getFamilyProfile(), {
    inviteCode: createInviteCode(),
    updatedAt: todayStr()
  });
  wx.setStorageSync(FAMILY_PROFILE_KEY, profile);
  cloudData.schedulePush();
  return profile;
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
  cloudData.schedulePush();
  return data;
}

function save(st, options) {
  wx.setStorageSync(KEY, st);
  if (!(options && options.localOnly)) cloudData.schedulePush();
}

function loadGrowthGoals() {
  const saved = wx.getStorageSync(GROWTH_GOALS_KEY);
  return Array.isArray(saved) ? saved : [];
}

function saveGrowthGoals(goals) {
  wx.setStorageSync(GROWTH_GOALS_KEY, goals);
}

function getAppMode() { return wx.getStorageSync(APP_MODE_KEY) === 'child' ? 'child' : 'parent'; }
function setAppMode(mode) { const next = mode === 'child' ? 'child' : 'parent'; wx.setStorageSync(APP_MODE_KEY, next); return next; }
function isParentMode() { return getAppMode() === 'parent'; }
function ensureLocalDataSchema() { if (Number(wx.getStorageSync(LOCAL_DATA_VERSION_KEY)) < 1) wx.setStorageSync(LOCAL_DATA_VERSION_KEY, 1); }
function getLevelStatus(experience) { const exp = Math.max(0, Number(experience) || 0); let current = LEVELS[0]; for (let i = 0; i < LEVELS.length; i++) { if (exp >= LEVELS[i].exp) current = LEVELS[i]; }
  const next = LEVELS.find(item => item.level === current.level + 1) || null;
  return { experience: exp, levelNum: current.level, levelName: current.name, nextExperience: next ? next.exp : current.exp, progressPct: next ? Math.min(100, Math.round((exp - current.exp) / (next.exp - current.exp) * 100)) : 100, remaining: next ? Math.max(0, next.exp - exp) : 0 };
}

function goalView(goal) {
  const template = GROWTH_GOAL_TEMPLATES[goal.dim] || {};
  const stage = (goal.stages || [])[goal.currentStage] || null;
  return Object.assign({}, goal, { templateName: template.name || '成长目标', stage: stage, done: !stage, progressPct: stage ? Math.min(100, Math.round((stage.progress || 0) / stage.target * 100)) : 100 });
}

function getGrowthGoalTemplates() {
  return Object.keys(GROWTH_GOAL_TEMPLATES).map(key => ({ key: key, name: GROWTH_GOAL_TEMPLATES[key].name, desc: GROWTH_GOAL_TEMPLATES[key].desc, firstStage: GROWTH_GOAL_TEMPLATES[key].stages[0].name }));
}

function getGrowthGoals() {
  return loadGrowthGoals().map(goalView);
}

function addGoalStageTask(goal, stageIndex) {
  const stage = goal.stages[stageIndex];
  if (!stage) return null;
  const task = addCustomTask({ name: stage.name, points: stage.points, dim: goal.dim, frequency: 'daily', deadline: '', assignee: goal.assignee, goalId: goal.id, goalStage: stageIndex, localOnly: true });
  if (task) goal.taskId = task.id;
  return task;
}

function createGrowthGoal(input) {
  ensure();
  const dim = input && GROWTH_GOAL_TEMPLATES[input.dim] ? input.dim : '';
  const active = loadGrowthGoals().filter(item => item.status === 'active');
  if (!dim || active.length >= 2 || active.some(item => item.dim === dim)) return null;
  const template = GROWTH_GOAL_TEMPLATES[dim];
  const goal = { id: 'goal_' + Date.now(), dim: dim, name: template.name, desc: template.desc, assignee: cleanText(input && input.assignee, 32) || (state().child && state().child.name) || '孩子', status: 'active', currentStage: 0, stages: template.stages.map(stage => Object.assign({}, stage, { progress: 0 })), createdAt: todayStr(), taskId: '' };
  addGoalStageTask(goal, 0);
  const goals = loadGrowthGoals(); goals.unshift(goal); saveGrowthGoals(goals);
  return goalView(goal);
}

function advanceGrowthGoal(goalId, stageIndex, taskId) {
  const goals = loadGrowthGoals();
  const goal = goals.find(item => item.id === goalId && item.status === 'active');
  if (!goal || goal.currentStage !== Number(stageIndex) || goal.taskId !== taskId) return null;
  const stage = goal.stages[goal.currentStage];
  if (!stage) return null;
  stage.progress = Math.min(stage.target, (stage.progress || 0) + 1);
  let completed = false;
  if (stage.progress >= stage.target) {
    completed = true;
    const task = (state()._ci.customTasks || []).find(item => item.id === taskId);
    if (task) task.active = false;
    state().todayTasks = state().todayTasks.filter(item => item.id !== taskId);
    goal.currentStage += 1;
    if (goal.currentStage >= goal.stages.length) { goal.status = 'completed'; goal.completedAt = todayStr(); goal.taskId = ''; }
    else addGoalStageTask(goal, goal.currentStage);
  }
  saveGrowthGoals(goals);
  save(state()._ci, { localOnly: true });
  return { completed: completed, goal: goalView(goal) };
}

function getAssessment() {
  const saved = wx.getStorageSync(ASSESSMENT_KEY);
  return saved && typeof saved === 'object' && Array.isArray(saved.dimensions) ? saved : null;
}

function getReminderReadState() {
  const saved = wx.getStorageSync(REMINDER_READ_KEY);
  return saved && typeof saved === 'object' ? saved : {};
}

function getSmartReminders() {
  ensure();
  const s = state();
  const read = getReminderReadState();
  const reminders = [];
  const pendingTasks = (s.todayTasks || []).filter(task => !task.done).length;
  if (pendingTasks) reminders.push({ id: 'daily-' + todayStr(), icon: '✅', title: '今日任务待打卡', text: '今天还有 ' + pendingTasks + ' 项任务等待完成', target: 'checkin' });
  const approvals = getPendingApprovals();
  if (approvals.length) reminders.push({ id: 'approval-' + approvals.map(item => item.id).join('-'), icon: '👨‍👩‍👦', title: '等待家长确认', text: approvals.length + ' 项孩子打卡等待家长确认', target: 'approvals' });
  const meetings = (s.meetings || []).filter(item => item.status === 'pending');
  if (meetings.length) reminders.push({ id: 'meeting-' + meetings.map(item => item.id).join('-'), icon: '🪑', title: '家庭会议待召开', text: '有 ' + meetings.length + ' 场家庭会议等待处理', target: 'family' });
  if (!getAssessment()) reminders.push({ id: 'assessment', icon: '🧭', title: '完成成长初评', text: '用约 3 分钟，记录孩子当前成长起点', target: 'assessment' });
  return reminders.filter(item => !read[item.id]);
}

function markReminderRead(id) {
  if (!id) return;
  const read = getReminderReadState();
  read[id] = todayStr();
  wx.setStorageSync(REMINDER_READ_KEY, read);
  cloudData.schedulePush();
}

function markAllRemindersRead() {
  getSmartReminders().forEach(item => markReminderRead(item.id));
}

function saveAssessment(data) {
  const input = data || {};
  const dimensions = (input.dimensions || []).map(item => ({
    key: item.key,
    name: item.name,
    score: Math.max(0, Math.min(100, Math.round(Number(item.score) || 0))),
    answerCount: Math.max(0, Number(item.answerCount) || 0)
  }));
  const overall = dimensions.length ? Math.round(dimensions.reduce((sum, item) => sum + item.score, 0) / dimensions.length) : 0;
  const level = ASSESSMENT_LEVELS.find(item => overall >= item.min) || ASSESSMENT_LEVELS[ASSESSMENT_LEVELS.length - 1];
  const strengths = dimensions.slice().sort((a, b) => b.score - a.score);
  const result = {
    completedAt: input.completedAt || todayStr(),
    overall: overall,
    levelName: level.name,
    levelNote: level.note,
    dimensions: dimensions,
    strength: strengths[0] || null,
    focus: strengths[dimensions.length - 1] || null
  };
  wx.setStorageSync(ASSESSMENT_KEY, result);
  cloudData.schedulePush();
  return result;
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
  const experience = 1200 + hist.filter(item => item.delta > 0).reduce((sum, item) => sum + item.delta, 0);
  const level = getLevelStatus(experience);
  s.child.experience = level.experience;
  s.child.levelNum = level.levelNum;
  s.child.levelName = level.levelName;
  s.child.nextLevelExp = level.nextExperience;
  const contribution = { heart: 0, body: 0, habit: 0, taste: 0 };
  hist.filter(item => item.delta > 0 && Object.prototype.hasOwnProperty.call(contribution, item.dim)).forEach(item => { contribution[item.dim] += item.delta * DIMENSION_MULTIPLIERS[item.dim]; });
  s.dimensions.forEach(item => { const value = contribution[item.key] || 0; item.score = Math.round(value * 10) / 10; item.pct = Math.min(100, DIMENSION_BASELINES[item.key] + Math.floor(value / 20)); });
}

// 在 app.js onLaunch 中调用：恢复打卡状态 + 重建积分/历史。
// 必须传入 app 实例（this），因为 onLaunch 阶段 getApp() 尚未就绪。
function initCheckIns(appInstance) {
  const s = (appInstance && appInstance.globalData) ? appInstance.globalData : state();
  _app = getApp() || appInstance || null;
  const st = load();
  ensureLocalDataSchema();
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
  (st.customTasks || []).filter(item => item.active && (item.frequency === 'daily' ? (!item.deadline || todayStr() <= item.deadline) : item.date === formatToday())).forEach(item => {
    if (!s.todayTasks.some(task => task.id === item.id)) s.todayTasks.push(Object.assign({}, item, { done: !!st.daily[item.id], fromCustomTask: true }));
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
  let goalUpdate = null;
  if (t.done && t.goalId) goalUpdate = advanceGrowthGoal(t.goalId, t.goalStage, t.id);
  else save(st, { localOnly: !!t.localOnly });
  return { done: t.done, delta: t.done ? t.points : -t.points, goalUpdate: goalUpdate };
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

function submitCenter(id, note, evidence) {
  ensure();
  const s = state();
  if (!centerMap[id]) return null;
  const status = getCenterStatus(id);
  if (status !== 'todo') return { status: status, changed: false };
  const media = Array.isArray(evidence) ? evidence.slice(0, 3).map(item => ({ path: cleanText(item && item.path, 300), thumb: cleanText(item && item.thumb, 300), type: item && item.type === 'video' ? 'video' : 'image' })).filter(item => item.path) : [];
  const record = { status: 'pending', date: formatToday(), note: cleanText(note, 80), evidence: media };
  s._ci.center[id] = record;
  s.centerTaskStatus[id] = record.status;
  save(s._ci);
  return { status: record.status, changed: true };
}

function approveCenter(id) {
  ensure();
  if (!isParentMode()) return { forbidden: true };
  const s = state();
  const record = s._ci.center[id];
  if (!record || record.status !== 'pending') return null;
  const oldLevel = Number(s.child.levelNum) || 1;
  record.status = 'approved';
  s.centerTaskStatus[id] = 'approved';
  s.centerTasksDone[id] = record.date;
  recompute(s, s._ci);
  save(s._ci);
  return { points: centerMap[id].points, experience: centerMap[id].points, status: 'approved', levelUp: s.child.levelNum > oldLevel, levelName: s.child.levelName };
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
      date: s._ci.center[id].date,
      note: s._ci.center[id].note || '', evidence: s._ci.center[id].evidence || []
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
  const meetingsDone = (s.meetings || []).filter(item => item.status === 'done').length;
  const redeemedCount = (s._ci.redeemed || []).length;
  const aiCount = (s._ci.aiCheckins || []).length;
  const lowestDim = dims.length ? Math.min.apply(null, dims.map(item => Number(item.pct) || 0)) : 0;
  const allRound = dims.length > 0 && dims.every(item => Number(item.pct) >= 80);
  const defs = [
    { id: 'first-checkin', name: '打卡新星', icon: '🌟', desc: '完成第 1 次任务打卡', value: taskCount, target: 1, unit: '次打卡' },
    { id: 'habit-master', name: '好习惯王', icon: '🌱', desc: '累计完成 7 次任务打卡', value: taskCount, target: 7, unit: '次打卡' },
    { id: 'morning-power', name: '晨光行动派', icon: '🌤️', desc: '累计完成 15 次任务打卡', value: taskCount, target: 15, unit: '次打卡' },
    { id: 'reading-star', name: '诵读小达人', icon: '📖', desc: '累计诵读经典 10 章', value: readCount, target: 10, unit: '章' },
    { id: 'bookworm', name: '书香少年', icon: '📚', desc: '累计诵读经典 30 章', value: readCount, target: 30, unit: '章' },
    { id: 'points-rookie', name: '积分达人', icon: '⭐', desc: '成长积分达到 500 分', value: points, target: 500, unit: '分' },
    { id: 'points-master', name: '积分大师', icon: '💎', desc: '成长积分达到 1500 分', value: points, target: 1500, unit: '分' },
    { id: 'persistence', name: '坚持不懈', icon: '🔥', desc: '连续打卡 7 天', value: streak, target: 7, unit: '天' },
    { id: 'self-discipline', name: '自律标兵', icon: '⏱️', desc: '连续打卡 21 天', value: streak, target: 21, unit: '天' },
    { id: 'task-champion', name: '任务冠军', icon: '🏅', desc: '累计完成 50 次任务打卡', value: taskCount, target: 50, unit: '次打卡' },
    { id: 'family-partner', name: '家庭小主人', icon: '🏠', desc: '完成 3 次家庭会议', value: meetingsDone, target: 3, unit: '次会议' },
    { id: 'wish-achiever', name: '心愿实现家', icon: '🎁', desc: '完成 3 次心愿兑换', value: redeemedCount, target: 3, unit: '次兑换' },
    { id: 'ai-companion', name: 'AI 好伙伴', icon: '🤖', desc: '通过 AI 完成 5 次打卡', value: aiCount, target: 5, unit: '次 AI 打卡' },
    { id: 'all-round', name: '全能少年', icon: '👑', desc: '四维成长均达到 80%', value: allRound ? 80 : lowestDim, target: 80, unit: '%' }
  ];
  return defs.map(item => {
    const value = Math.max(0, Number(item.value) || 0);
    return Object.assign({}, item, { got: value >= item.target, progress: Math.min(100, Math.round(value / item.target * 100)), displayValue: Math.min(value, item.target) });
  });
}

function getScoreRules() {
  return [
    { key: 'heart', name: '好身心', weight: '×2', tip: '德育与经典学习，成长贡献加倍' },
    { key: 'body', name: '好身体', weight: '×1.5', tip: '饮食、睡眠与运动，成长贡献加权' },
    { key: 'habit', name: '好习惯', weight: '×1.3', tip: '整理、规划与自律，成长贡献加权' },
    { key: 'taste', name: '好品味', weight: '×1', tip: '阅读、审美与创造，按原始积分计入' }
  ];
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
  cloudData.schedulePush();
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

function getCustomTasks() { ensure(); return (state()._ci.customTasks || []).slice(); }
function addCustomTask(input) {
  ensure();
  const name = cleanText(input && input.name, 24);
  const points = Number(input && input.points);
  const dim = ['heart', 'body', 'habit', 'taste'].indexOf(input && input.dim) >= 0 ? input.dim : 'habit';
  if (!name || !Number.isInteger(points) || points < 1 || points > 100) return null;
  const frequency = input && input.frequency === 'daily' ? 'daily' : 'once';
  const deadline = typeof (input && input.deadline) === 'string' ? input.deadline : '';
  const assignee = cleanText(input && input.assignee, 32) || (state().child && state().child.name) || '孩子';
  const task = { id: 'custom_' + Date.now(), name, points, dim, date: formatToday(), frequency, deadline, assignee, active: true, goalId: cleanText(input && input.goalId, 64), goalStage: Number(input && input.goalStage) || 0, localOnly: !!(input && input.localOnly) };
  state()._ci.customTasks.unshift(task); save(state()._ci, { localOnly: task.localOnly });
  state().todayTasks.push(Object.assign({}, task, { done: false, fromCustomTask: true }));
  return task;
}
function removeCustomTask(id) { ensure(); const st = state()._ci; const item = (st.customTasks || []).find(task => task.id === id); if (!item) return false; item.active = false; state().todayTasks = state().todayTasks.filter(task => task.id !== id); delete st.daily[id]; save(st, { localOnly: !!item.localOnly }); recompute(state(), st); return true; }

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
  getScoreRules,
  getAppMode, setAppMode, isParentMode, getLevelStatus,
  getAssessment, saveAssessment,
  getSmartReminders, markReminderRead, markAllRemindersRead,
  redeem, login, isSigned, recordBonus,
  aiRecordBonus, getAiCheckinRecords, addDailyTask,
  getCustomTasks, addCustomTask, removeCustomTask,
  getGrowthGoalTemplates, getGrowthGoals, createGrowthGoal,
  getRewards, saveRewards,
  getMeetings, createMeeting, updateMeeting, closeMeeting,
  getFamilyMembers, updateFamilyMember, addFamilyMember, removeFamilyMember, getFamilyConvention, saveFamilyConvention,
  getFamilyProfile, refreshFamilyInviteCode,
  isCaseLiked, isCaseFaved, toggleCaseLike, toggleCaseFav
};
