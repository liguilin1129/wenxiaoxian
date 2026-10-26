const app = getApp();
const store = require('../../utils/store.js');
const shopCatalog = require('../../utils/shop-catalog.js');
const QUICK_ENTRIES = [
  { key: 'tasks', name: '任务中心', url: '/pages/tasks/tasks' },
  { key: 'smart', name: '智能提醒', url: '/pages/reminders/reminders' },
  { key: 'personal', name: '个性化提醒', placeholder: true }
];
Page({
  data: { signed: false, child: {}, badges: [], today: [], taskPreview: [], total: 0, doneCount: 0, remaining: 0,
    reminderText: '暂无提醒', reminderPreview: [], reminderCount: 0, quickEntries: QUICK_ENTRIES,
    products: [], productSlots: [{ id: 'preview-1' }, { id: 'preview-2' }],
    statusBarHeight: 24, navHeight: 44, navRight: 100, searchHeight: 32,
    searchKeywords: ['搜索任务与好习惯', '经典学习 · 论语', '成长银行 · 成长记录', '积分商城 · 心愿好礼'],
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
      searchHeight: valid ? capsule.height : 32,
      navRight: valid ? info.windowWidth - capsule.left + 12 : 100 });
  },
  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) this.getTabBar().setData({ selected: 0 });
    this.refresh();
    this.stopReminderTimer();
    this._reminderTimer = setInterval(() => this.refresh(), 60000);
  },
  onHide() { this.stopReminderTimer(); },
  onUnload() { this.stopReminderTimer(); },
  stopReminderTimer() { if (this._reminderTimer) clearInterval(this._reminderTimer); this._reminderTimer = null; },
  refresh() {
    this.setData({ products: shopCatalog.getProducts().slice(0, 4) });
    const signed = !!store.isSigned();
    if (!signed) return this.setData({ signed: false, child: {}, badges: [], today: [], taskPreview: [], total: 0,
      doneCount: 0, remaining: 0, reminderCount: 0, reminderPreview: [], reminderText: '登录后查看成长提醒' });
    const isParent = store.isParentMode();
    store.getTodayTasks();
    const g = app.globalData;
    const allBadges = store.getBadges();
    const reminders = store.getSmartReminders();
    const dimName = {};
    g.dimensions.forEach(item => { dimName[item.key] = item.name; });
    const tasks = g.todayTasks.map(item => Object.assign({}, item, { done: !!item.done, dimensionName: dimName[item.dim] || '成长任务' }))
      .sort((a,b) => Number(a.done) - Number(b.done));
    const done = store.todayDoneCount();
    this.setData({ signed: true, child: g.child, isParent,
      badges: allBadges.filter(b => b.got).concat(allBadges.filter(b => !b.got)).slice(0,4),
      today: tasks.slice(0,4), taskPreview: tasks.filter(item => !item.done).slice(0,2), total: tasks.length, doneCount: done, remaining: tasks.filter(item => !item.done).length,
      reminderCount: reminders.length, reminderPreview: reminders.slice(0, 2),
      reminderText: reminders.length ? reminders[0].text : '暂无提醒' });
  },
  openSearch() { wx.navigateTo({ url: '/pages/search/search' }); },
  goChallenges() { wx.navigateTo({ url: '/pages/challenges/challenges' }); },
  goShop() { wx.navigateTo({ url: '/pages/shop/shop' }); },
  goProduct(e) {
    const id = e.currentTarget.dataset.id;
    const preview = String(id || '').indexOf('preview-') === 0;
    if ((!preview && !shopCatalog.getProduct(id)) || this._openingProduct) return;
    this._openingProduct = true;
    wx.navigateTo({ url: '/pages/product-detail/product-detail?id=' + encodeURIComponent(id) + (preview ? '&preview=1' : ''),
      complete: () => { this._openingProduct = false; } });
  },
  goLogin() { wx.navigateTo({ url: '/pages/login/login' }); },
  goBadges() { if (!store.isSigned()) return this.goLogin(); wx.navigateTo({ url: '/pages/badges/badges' }); },
  goProfileDetail() { if (!store.isSigned()) return this.goLogin(); wx.navigateTo({ url: '/pages/profile-detail/profile-detail' }); },
  goReminders() { if (!store.isSigned()) return this.goLogin(); wx.navigateTo({ url: '/pages/reminders/reminders' }); },
  goTasks() { if (!store.isSigned()) return this.goLogin(); wx.navigateTo({ url: '/pages/tasks/tasks' }); },
  goQuick(e) {
    const entry = QUICK_ENTRIES.find(item => item.key === e.currentTarget.dataset.key);
    if (!entry) return;
    if (!store.isSigned()) return this.goLogin();
    if (entry.parentOnly && !store.isParentMode()) return wx.showToast({ title: '请由家长模式查看提醒', icon: 'none' });
    if (entry.placeholder) return wx.showToast({ title: '个性化提醒暂未配置', icon: 'none' });
    if (entry.tab) wx.switchTab({ url: entry.url }); else wx.navigateTo({ url: entry.url });
  },
  toggleToday(e) {
    const idx = app.globalData.todayTasks.findIndex(item => item.id === e.currentTarget.dataset.id);
    if (idx < 0) return;
    const task = app.globalData.todayTasks[idx];
    if (task.done) return;
    const result = store.toggleDaily(idx);
    if (!result) return;
    wx.showToast({ title: result.locked ? '该任务已完成' : '打卡 +' + result.delta + ' 分', icon: 'none' });
    this.refresh();
  }
});
