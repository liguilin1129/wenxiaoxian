const app = getApp();
const store = require('../../utils/store.js');

function dimNameMap() {
  const m = {};
  app.globalData.dimensions.forEach(d => { m[d.key] = d.name; });
  return m;
}

Page({
  data: { points: 0, filter: 'all', groups: [], dimName: {}, todayGain: 0, totalEarned: 0, totalSpent: 0, recordCount: 0 },
  onShow() { this.refresh(); },
  refresh() {
    const g = app.globalData;
    let list = g.pointsHistory.slice();
    if (this.data.filter === 'get') list = list.filter(p => p.delta > 0);
    if (this.data.filter === 'use') list = list.filter(p => p.delta < 0);
    const groups = [];
    list.forEach((record) => {
      let group = groups.find(item => item.date === record.date);
      if (!group) {
        group = { date: record.date, list: [] };
        groups.push(group);
      }
      group.list.push(record);
    });
    const all = g.pointsHistory;
    this.setData({
      points: g.child.points,
      groups: groups,
      dimName: dimNameMap(),
      todayGain: store.todayGain(),
      totalEarned: all.filter(item => item.delta > 0).reduce((sum, item) => sum + item.delta, 0),
      totalSpent: Math.abs(all.filter(item => item.delta < 0).reduce((sum, item) => sum + item.delta, 0)),
      recordCount: all.length
    });
  },
  setFilter(e) {
    this.setData({ filter: e.currentTarget.dataset.f }, () => this.refresh());
  }
});
