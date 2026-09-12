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
    const statusMap = app.globalData.centerTaskStatus || {};
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
        status: statusMap[t.id] || 'todo',
        done: statusMap[t.id] === 'approved'
      }))
    }));
    const doneCount = Object.keys(statusMap).filter(id => statusMap[id] === 'approved').length;
    let total = 0;
    all.forEach(g => { total += g.list.length; });
    this.setData({ groups: enriched, dimColor: dimColor, doneCount: doneCount, total: total });
  },
  toggleCenter(e) {
    const id = e.currentTarget.dataset.id;
    const status = store.getCenterStatus(id);
    if (status === 'approved') return wx.showToast({ title: '家长已确认', icon: 'none' });
    if (status === 'pending') return wx.showToast({ title: '等待家长确认', icon: 'none' });
    const res = store.submitCenter(id);
    if (!res) return;
    wx.showToast({ title: '已提交，等待家长确认', icon: 'none' });
    this.buildGroups();
  },
  goDetail(e) {
    wx.navigateTo({ url: '/pages/task-detail/task-detail?id=' + e.currentTarget.dataset.id });
  }
});
