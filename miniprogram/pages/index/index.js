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
  { icon: '✅', name: '任务打卡', url: '/pages/checkin/checkin', bg: '#EEEDFE', color: '#4F46E5' },
  { icon: '⭐', name: '积分明细', url: '/pages/points/points', bg: '#FFF7E6', color: '#B7791F' },
  { icon: '📚', name: '经典学习', url: '/pages/classics/classics', bg: '#FFF1F3', color: '#E11D6F' },
  { icon: '🪑', name: '家庭会议', url: '/pages/family/family', bg: '#ECFDF5', color: '#0F9D6B' },
  { icon: '🎁', name: '积分商城', url: '/pages/rewards/rewards', bg: '#EEF2FF', color: '#4338CA' },
  { icon: '👨‍👩‍👦', name: '我的家庭', url: '/pages/family/family', bg: '#F0FDFA', color: '#0D9488' },
  { icon: '💬', name: '成长社区', url: '/pages/community/community', bg: '#F5F3FF', color: '#7C3AED' },
  { icon: '📰', name: '发现文章', url: '/pages/article-list/article-list', bg: '#FFF1F3', color: '#DB2777' }
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
    guestFeats: [
      { icon: '✅', name: '任务打卡', desc: '每日任务 · 好习惯养成' },
      { icon: '⭐', name: '积分成长', desc: '积分明细 · 四维成长报告' },
      { icon: '🎁', name: '奖励兑换', desc: '积分商城 · 心愿兑换' },
      { icon: '🪑', name: '家庭会议', desc: '全家商议 · 调整任务与心愿' }
    ]
  },
  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 0 });
    }
    // 每次回到首页都强制把 AI 悬浮按钮复位到默认位置
    const fab = this.selectComponent('#aiAssistant');
    if (fab && typeof fab.resetFab === 'function') {
      fab.resetFab();
    }
    this.refresh();
  },
  refresh() {
    const signed = !!store.isSigned();
    if (!signed) {
      // 未登录/未签约：不加载任何用户信息，只展示游客引导
      this.setData({
        signed: false, child: {}, dims: [], today: [], doneCount: 0,
        total: 0, ovPct: 0, levelPct: 0, need: 0, reminders: []
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
      levelPct: levelPct,
      nextLevel: child.levelNum + 1,
      need: need,
      classicToday: mock.classicToday,
      reminders: reminders
    });
  },
  goLogin() {
    // 未登录 → 轻量资料设置（与家庭会议解耦，不再强制签约）
    wx.navigateTo({ url: '/pages/login/login' });
  },
  goReport() { wx.navigateTo({ url: '/pages/report/report' }); },
  goCheckin() { wx.navigateTo({ url: '/pages/checkin/checkin' }); },
  goClassics() { wx.navigateTo({ url: '/pages/classics/classics' }); },
  goSettings() {
    // 轻量设置：暂用「我的」页承载（会员/资料/退出入口齐全）
    wx.switchTab({ url: '/pages/profile/profile' });
  },
  onSearch() {
    wx.showToast({ title: '搜索即将上线', icon: 'none' });
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
