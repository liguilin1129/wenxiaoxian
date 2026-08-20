const app = getApp();

Page({
  data: { filter: 'all', groups: [], dimColor: {} },
  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 1 });
    }
    this.buildGroups();
  },
  setFilter(e) {
    this.setData({ filter: e.currentTarget.dataset.f });
    this.buildGroups();
  },
  buildGroups() {
    const all = app.globalData.tasks;
    const f = this.data.filter;
    const groups = f === 'all' ? all : all.filter(g => g.dim === f);
    const dimColor = {};
    app.globalData.dimensions.forEach(d => { dimColor[d.key] = d.dark; });
    this.setData({ groups: groups, dimColor: dimColor });
  },
  goDetail(e) {
    wx.navigateTo({ url: '/pages/task-detail/task-detail?id=' + e.currentTarget.dataset.id });
  }
});
