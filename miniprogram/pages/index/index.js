const app = getApp();
const store = require('../../utils/store.js');

function buildDimName() {
  const m = {};
  app.globalData.dimensions.forEach(d => { m[d.key] = d.name; });
  return m;
}

Page({
  data: {
    child: {}, dims: [], today: [], doneCount: 0, total: 0,
    dimName: {}, levelPct: 0, nextLevel: 6, need: 0
  },
  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 0 });
    }
    this.refresh();
  },
  refresh() {
    const g = app.globalData;
    const child = g.child;
    const need = child.nextLevelPoints - child.points;
    const levelPct = Math.max(0, Math.min(100, Math.round(child.points / child.nextLevelPoints * 100)));
    this.setData({
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
  goReport() { wx.navigateTo({ url: '/pages/report/report' }); },
  goCheckin() { wx.navigateTo({ url: '/pages/checkin/checkin' }); },
  goClassics() { wx.switchTab({ url: '/pages/classics/classics' }); }
});
