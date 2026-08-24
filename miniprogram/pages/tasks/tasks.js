const app = getApp();
const store = require('../../utils/store.js');

Page({
  data: { filter: 'all', groups: [], dimColor: {}, doneCount: 0, total: 0 },
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
    const doneMap = app.globalData.centerTasksDone || {};
    // 给每个任务附加「奖励总分」与「是否已打卡」
    const enriched = groups.map(g => ({
      dim: g.dim,
      dimName: g.dimName,
      list: g.list.map(t => ({
        id: t.id,
        name: t.name,
        tags: t.tags,
        rewards: t.rewards,
        points: t.rewards.reduce((s, r) => s + r.points, 0),
        done: !!doneMap[t.id]
      }))
    }));
    const doneCount = Object.keys(doneMap).length;
    let total = 0;
    all.forEach(g => { total += g.list.length; });
    this.setData({ groups: enriched, dimColor: dimColor, doneCount: doneCount, total: total });
  },
  toggleCenter(e) {
    const id = e.currentTarget.dataset.id;
    const res = store.toggleCenter(id);
    if (res) {
      const tip = res.done ? '打卡 +' + res.delta + ' 分' : '已取消打卡';
      wx.showToast({ title: tip, icon: 'none' });
      this.buildGroups();
    }
  },
  goDetail(e) {
    wx.navigateTo({ url: '/pages/task-detail/task-detail?id=' + e.currentTarget.dataset.id });
  }
});
