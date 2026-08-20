const app = getApp();

Page({
  data: { task: {}, detail: {}, meta: {} },
  onLoad(query) {
    const id = query.id;
    const g = app.globalData;
    let task = null;
    let dimName = '';
    g.tasks.forEach(group => {
      const found = group.list.find(t => t.id === id);
      if (found) { task = found; dimName = group.dimName; }
    });
    const detail = g.taskDetail[id] || { purpose: '', neigong: '—', classic: '—', rewards: [], methods: '' };
    const dim = g.dimensions.find(d => d.key === (task ? task.dim : '')) || {};
    const maxPoints = detail.rewards.length ? Math.max.apply(null, detail.rewards.map(r => r.points)) : 0;
    this.setData({
      task: task,
      detail: detail,
      meta: { dimName: dimName, dark: dim.dark || '#4F46E5' },
      maxPoints: maxPoints
    });
    if (task) {
      wx.setNavigationBarTitle({ title: task.name });
    }
  },
  checkin() {
    wx.showToast({ title: '已记录 +' + this.data.maxPoints + ' 分（演示）', icon: 'none' });
  }
});
