const app = getApp();
const store = require('../../utils/store.js');

function buildDimName() {
  const m = {};
  app.globalData.dimensions.forEach(d => { m[d.key] = d.name; });
  return m;
}

Page({
  data: {
    signed: false,
    child: {}, dims: [], today: [], doneCount: 0, total: 0,
    dimName: {}, levelPct: 0, nextLevel: 6, need: 0,
    guestFeats: [
      { icon: '✅', name: '任务打卡', desc: '每日任务 · 好习惯养成' },
      { icon: '⭐', name: '积分成长', desc: '积分明细 · 四维成长报告' },
      { icon: '🎁', name: '奖励兑换', desc: '积分商城 · 心愿兑换' },
      { icon: '🪑', name: '家庭会议', desc: '全家商议 · 共同签订成长合约' }
    ]
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
      this.setData({ signed: false, child: {}, dims: [], today: [], doneCount: 0, total: 0, levelPct: 0, need: 0 });
      return;
    }
    const g = app.globalData;
    const child = g.child;
    const need = child.nextLevelPoints - child.points;
    const levelPct = Math.max(0, Math.min(100, Math.round(child.points / child.nextLevelPoints * 100)));
    this.setData({
      signed: true,
      child: child,
      dims: g.dimensions,
      today: g.todayTasks.slice(0, 4),
      doneCount: store.todayDoneCount(),
      total: g.todayTasks.length,
      dimName: buildDimName(),
      levelPct: levelPct,
      nextLevel: child.levelNum + 1,
      need: need
    });
  },
  goLogin() {
    // 未登录 → 进入家庭会议三步签约流程（guide）
    wx.navigateTo({ url: '/pages/guide/guide' });
  },
  goReport() { wx.navigateTo({ url: '/pages/report/report' }); },
  goCheckin() { wx.navigateTo({ url: '/pages/checkin/checkin' }); },
  goClassics() { wx.navigateTo({ url: '/pages/classics/classics' }); },
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
