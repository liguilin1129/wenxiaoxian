const app = getApp();

function dimNameMap() {
  const m = {};
  app.globalData.dimensions.forEach(d => { m[d.key] = d.name; });
  return m;
}

Page({
  data: { points: 0, filter: 'all', list: [], dimName: {} },
  onShow() { this.refresh(); },
  refresh() {
    const g = app.globalData;
    let list = g.pointsHistory;
    if (this.data.filter === 'get') list = list.filter(p => p.delta > 0);
    if (this.data.filter === 'use') list = list.filter(p => p.delta < 0);
    this.setData({ points: g.child.points, list: list, dimName: dimNameMap() });
  },
  setFilter(e) {
    this.setData({ filter: e.currentTarget.dataset.f }, () => this.refresh());
  }
});
