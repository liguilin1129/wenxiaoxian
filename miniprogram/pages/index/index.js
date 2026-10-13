const app = getApp();
const store = require('../../utils/store.js');
const QUICK_ENTRIES = [
  { key: 'tasks', name: '任务中心', url: '/pages/tasks/tasks', tab: true },
  { key: 'family', name: '家庭会议', url: '/pages/family/family', parentOnly: true },
  { key: 'bank', name: '成长银行', url: '/pages/growth-bank/growth-bank' },
  { key: 'learn', name: '学习中心', url: '/pages/classics/classics' }
];
Page({
  data: { signed: false, child: {}, badges: [], today: [], total: 0, doneCount: 0, remaining: 0,
    reminderText: '暂无待处理提醒', reminderCount: 0, quickEntries: QUICK_ENTRIES,
    statusBarHeight: 24, navHeight: 44, navRight: 100,
    banners: [
      { id: 'growth', image: '', label: '成长陪伴', title: '每一次小进步，都值得被看见', sub: '首页广告轮播位 · 待配置图片', tone: 'violet' },
      { id: 'reading', image: '', label: '一起阅读', title: '让好习惯，在每一天生根', sub: '首页广告轮播位 · 待配置图片', tone: 'mint' },
      { id: 'family', image: '', label: '家庭时光', title: '陪伴，是送给成长的礼物', sub: '首页广告轮播位 · 待配置图片', tone: 'peach' }
    ] },
  onLoad() {
    const info = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync();
    const capsule = wx.getMenuButtonBoundingClientRect ? wx.getMenuButtonBoundingClientRect() : null;
    const status = info.statusBarHeight || 24;
    const valid = capsule && capsule.top >= status && capsule.height > 0;
    this.setData({ statusBarHeight: status, navHeight: valid ? (capsule.top - status) * 2 + capsule.height : 44,
      navRight: valid ? info.windowWidth - capsule.left + 12 : 100 });
  },
  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) this.getTabBar().setData({ selected: 0 });
    this.refresh();
  },
  refresh() {
    const signed = !!store.isSigned();
    if (!signed) return this.setData({ signed: false, child: {}, badges: [], today: [], total: 0,
      doneCount: 0, remaining: 0, reminderCount: 0, reminderText: '登录后查看成长提醒' });
    const isParent = store.isParentMode();
    const g = app.globalData;
    const allBadges = store.getBadges();
    const reminders = store.getSmartReminders().filter(item => isParent || item.target === 'checkin');
    const dimName = {};
    g.dimensions.forEach(item => { dimName[item.key] = item.name; });
    const tasks = g.todayTasks.map(item => {
      const approved = g._ci && g._ci.customApprovals && g._ci.customApprovals[item.id];
      const pending = !!(!item.done && (item.pendingApproval || (approved && approved.status === 'pending')));
      return Object.assign({}, item, { done: !!item.done, pending, dimensionName: dimName[item.dim] || '成长任务' });
    }).sort((a,b) => Number(a.done) - Number(b.done) || Number(a.pending) - Number(b.pending));
    const done = store.todayDoneCount();
    this.setData({ signed: true, child: g.child, isParent,
      badges: allBadges.filter(b => b.got).concat(allBadges.filter(b => !b.got)).slice(0,4),
      today: tasks.slice(0,4), total: tasks.length, doneCount: done, remaining: Math.max(0,tasks.length-done),
      reminderCount: reminders.length, reminderText: reminders.length ? reminders[0].text : '暂无待处理提醒' });
  },
  openSearch() { wx.navigateTo({ url: '/pages/search/search' }); },
  goLogin() { wx.navigateTo({ url: '/pages/login/login' }); },
  goBadges() { wx.navigateTo({ url: '/pages/badges/badges' }); },
  goProfileDetail() { if (!store.isSigned()) return this.goLogin(); wx.navigateTo({ url: '/pages/profile-detail/profile-detail' }); },
  goReminders() { if (!store.isSigned()) return this.goLogin(); wx.navigateTo({ url: '/pages/reminders/reminders' }); },
  goTasks() { wx.switchTab({ url: '/pages/tasks/tasks' }); },
  goQuick(e) {
    const entry = QUICK_ENTRIES.find(item => item.key === e.currentTarget.dataset.key);
    if (!entry) return;
    if (!store.isSigned()) return this.goLogin();
    if (entry.parentOnly && !store.isParentMode()) return wx.showToast({ title: '家庭会议请由家长模式操作', icon: 'none' });
    if (entry.tab) wx.switchTab({ url: entry.url }); else wx.navigateTo({ url: entry.url });
  },
  toggleToday(e) {
    const idx = app.globalData.todayTasks.findIndex(item => item.id === e.currentTarget.dataset.id);
    if (idx < 0) return;
    const task = app.globalData.todayTasks[idx];
    if (task.done || task.pendingApproval) return;
    const result = store.toggleDaily(idx);
    if (!result) return;
    wx.showToast({ title: result.pending ? '已提交，待家长确认' : result.locked ? '该任务已完成' : '打卡 +' + result.delta + ' 分', icon: 'none' });
    this.refresh();
  }
});
