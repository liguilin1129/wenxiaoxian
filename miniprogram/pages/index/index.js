const app = getApp();
const store = require('../../utils/store.js');
const mock = require('../../utils/mock.js');

function buildDimName() {
  const m = {};
  app.globalData.dimensions.forEach(d => { m[d.key] = d.name; });
  return m;
}

// 首页快捷入口（对齐思维导图「快捷入口」规格）
const QUICK_ENTRIES = [
  { icon: '✅', name: '任务打卡', url: '/pages/checkin/checkin' },
  { icon: '⭐', name: '积分明细', url: '/pages/points/points' },
  { icon: '📚', name: '经典学习', url: '/pages/classics/classics' },
  { icon: '🪑', name: '家庭会议', url: '/pages/family/family' },
  { icon: '🎁', name: '积分商城', url: '/pages/rewards/rewards' },
  { icon: '👨‍👩‍👦', name: '我的家庭', url: '/pages/family/family' },
  { icon: '💬', name: '成长社区', url: '/pages/community/community' },
  { icon: '📰', name: '发现文章', url: '/pages/article-list/article-list' }
];

Page({
  data: {
    signed: false,
    child: {},
    dims: [],
    today: [],
    doneCount: 0,
    total: 0,
    ovPct: 0,
    dimName: {},
    levelPct: 0,
    nextLevel: 6,
    need: 0,
    classicToday: {},
    quickEntries: QUICK_ENTRIES,
    reminders: [],
    searchOpen: false,
    searchKey: '',
    searchResults: [],
    assessment: null,
    badges: [],
    badgeGot: 0,
    badgeTotal: 0,
    guestFeats: [
      { icon: '✅', name: '任务打卡', desc: '每日任务 · 好习惯养成' },
      { icon: '⭐', name: '积分成长', desc: '积分明细 · 四维成长报告' },
      { icon: '🎁', name: '奖励兑换', desc: '积分商城 · 心愿兑换' },
      { icon: '🪑', name: '家庭会议', desc: '全家商议 · 调整任务与心愿' }
    ],
    dateText: ''
  },
  onLoad() {
    const d = new Date();
    const wk = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][d.getDay()];
    this.setData({ dateText: wk + ' · ' + (d.getMonth() + 1) + '月' + d.getDate() + '日' });
  },
  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 0 });
    }
    this.refresh();
  },
  refresh() {
    const signed = !!store.isSigned();
    if (!signed) {
      // 未登录/未签约：不加载任何用户信息，只展示游客引导
      this.setData({
        signed: false, child: {}, dims: [], today: [], doneCount: 0,
        total: 0, ovPct: 0, levelPct: 0, need: 0, reminders: [], assessment: null
      });
      return;
    }
    const g = app.globalData;
    const child = g.child;
    const need = child.nextLevelPoints - child.points;
    const levelPct = Math.max(0, Math.min(100, Math.round(child.points / child.nextLevelPoints * 100)));
    const total = g.todayTasks.length;
    const doneCount = store.todayDoneCount();
    const ovPct = total ? Math.round(doneCount / total * 100) : 0;

    // 智能提醒：基于现有数据生成（不依赖后端）
    const reminders = [];
    const undone = total - doneCount;
    if (undone > 0) {
      reminders.push({ icon: '✅', text: `今天还有 ${undone} 项任务待打卡` });
    }
    try {
      const meetings = store.getMeetings() || [];
      const pending = meetings.filter(m => m.status === 'open').length;
      if (pending > 0) {
        reminders.push({ icon: '🪑', text: `有 ${pending} 个家庭会议待召开` });
      }
    } catch (e) { /* getMeetings 不可用时忽略 */ }

    this.setData({
      signed: true,
      child: child,
      dims: g.dimensions,
      today: g.todayTasks.slice(0, 4),
      doneCount: doneCount,
      total: total,
      ovPct: ovPct,
      dimName: buildDimName(),
      assessment: store.getAssessment(),
      levelPct: levelPct,
      nextLevel: child.levelNum + 1,
      need: need,
      classicToday: mock.classicToday,
      reminders: reminders,
      // 荣誉墙：加载成就勋章 + 已点亮数量
      badges: store.getBadges().slice(0, 8),
      badgeGot: store.getBadges().filter(b => b.got).length,
      badgeTotal: store.getBadges().length
    });
  },
  goLogin() {
    // 未登录 → 轻量资料设置（与家庭会议解耦，不再强制签约）
    wx.navigateTo({ url: '/pages/login/login' });
  },
  goReport() { wx.navigateTo({ url: '/pages/report/report' }); },
  goPoints() { wx.navigateTo({ url: '/pages/points/points' }); },
  goCheckin() { wx.navigateTo({ url: '/pages/checkin/checkin' }); },
  goClassics() { wx.navigateTo({ url: '/pages/classics/classics' }); },
  goTasks() { wx.switchTab({ url: '/pages/tasks/tasks' }); },
  goBadges() {
    wx.navigateTo({ url: '/pages/badges/badges' });
  },
  goReminders() {
    wx.showToast({ title: '全部提醒即将上线', icon: 'none' });
  },
  goSettings() {
    // 轻量设置：暂用「我的」页承载（会员/资料/退出入口齐全）
    wx.switchTab({ url: '/pages/profile/profile' });
  },
  // 顶部搜索：实时过滤本地 mock 数据（任务 / 经典 / 商城 / 文章 / 案例）
  openSearch() {
    this.setData({ searchOpen: true });
  },
  closeSearch() {
    this.setData({ searchOpen: false, searchKey: '', searchResults: [] });
  },
  onSearchInput(e) {
    const key = (e.detail.value || '').trim();
    this.setData({ searchKey: key });
    this.runSearch(key);
  },
  clearSearch() {
    this.setData({ searchKey: '', searchResults: [] });
  },
  runSearch(key) {
    if (!key) {
      this.setData({ searchResults: [] });
      return;
    }
    const res = [];
    // 任务（任务中心）
    mock.tasks.forEach(g => {
      g.list.forEach(t => {
        if (t.name.indexOf(key) > -1) {
          res.push({ key: 'task-' + t.id, type: '任务', icon: '✅', name: t.name, sub: g.dimName, url: '/pages/tasks/tasks' });
        }
      });
    });
    // 经典
    mock.classics.forEach(c => {
      if (c.name.indexOf(key) > -1) {
        res.push({ key: 'classic-' + c.name, type: '经典', icon: '📚', name: '《' + c.name + '》', sub: '已读 ' + c.read + '/' + c.total, url: '/pages/classics/classics' });
      }
    });
    // 商城（奖励）
    mock.rewards.forEach(r => {
      if (r.name.indexOf(key) > -1) {
        res.push({ key: 'reward-' + r.id, type: '商城', icon: '🎁', name: r.name, sub: '消耗 ' + r.cost + ' 分', url: '/pages/rewards/rewards' });
      }
    });
    // 文章
    mock.discoverArticles.forEach(a => {
      if (a.title.indexOf(key) > -1 || a.summary.indexOf(key) > -1) {
        res.push({ key: 'article-' + a.id, type: '文章', icon: '📰', name: a.title, sub: a.category, url: '/pages/article-list/article-list' });
      }
    });
    // 案例
    mock.cases.forEach(c => {
      if (c.title.indexOf(key) > -1 || c.summary.indexOf(key) > -1) {
        res.push({ key: 'case-' + c.id, type: '案例', icon: '💬', name: c.title, sub: c.course, url: '/pages/case-list/case-list' });
      }
    });
    this.setData({ searchResults: res });
  },
  goSearchItem(e) {
    const url = e.currentTarget.dataset.url;
    const tabs = ['/pages/index/index', '/pages/tasks/tasks', '/pages/discover/discover', '/pages/profile/profile'];
    if (tabs.indexOf(url) > -1) {
      wx.switchTab({ url });
    } else {
      wx.navigateTo({ url });
    }
  },
  goQuick(e) {
    const { url, tab } = e.currentTarget.dataset;
    if (tab) {
      wx.switchTab({ url });
    } else {
      wx.navigateTo({ url });
    }
  },
  toggleToday(e) {
    const id = e.currentTarget.dataset.id;
    const g = app.globalData;
    const idx = g.todayTasks.findIndex(t => t.id === id);
    if (idx < 0) return;
    const res = store.toggleDaily(idx);
    if (res) {
      wx.showToast({ title: res.delta > 0 ? '打卡 +' + res.delta + ' 分' : '已取消打卡', icon: 'none' });
      this.refresh();
    }
  }
});
