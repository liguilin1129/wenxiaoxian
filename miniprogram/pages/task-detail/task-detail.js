const app = getApp();
const store = require('../../utils/store');

Page({
  data: { task: {}, detail: {}, meta: {}, points: 0, done: false },
  onLoad(query) {
    const id = query.id;
    const g = app.globalData;
    let task = null;
    let dimName = '';
    let total = 0;
    g.tasks.forEach(group => {
      const found = group.list.find(t => t.id === id);
      if (found) {
        task = found;
        dimName = group.dimName;
        // 「奖励总分」与任务中心口径一致（toggleCenter 实际加的分），避免显示与加分不符
        total = found.rewards.reduce((s, r) => s + r.points, 0);
      }
    });
    const detail = g.taskDetail[id] || { purpose: '', neigong: '—', classic: '—', rewards: [], methods: '' };
    const dim = g.dimensions.find(d => d.key === (task ? task.dim : '')) || {};
    const done = store.isCenterDone(id);
    this.setData({
      task: task,
      detail: detail,
      meta: { dimName: dimName, dark: dim.dark || '#4F46E5' },
      points: total,
      done: done
    });
    if (task) {
      wx.setNavigationBarTitle({ title: task.name });
    }
  },
  checkin() {
    if (!this.data.points) {
      wx.showToast({ title: '该任务暂无积分奖励', icon: 'none' });
      return;
    }
    const res = store.toggleCenter(this.data.task.id);
    if (!res) {
      wx.showToast({ title: '任务不存在', icon: 'none' });
      return;
    }
    this.setData({ done: res.done });
    wx.showToast({
      title: res.done ? ('已打卡 +' + res.delta + ' 分') : '已取消打卡',
      icon: 'none'
    });
  }
});
