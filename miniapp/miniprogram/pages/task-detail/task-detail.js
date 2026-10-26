const app = getApp();
const store = require('../../utils/store');
Page({
  data: { task: null, detail: {}, meta: {}, points: 0, status: 'todo' },
  onLoad(query) { this.taskId = query.id; this.refresh(); },
  onShow() { if (this.taskId) this.refresh(); },
  refresh() {
    const task = store.getTask(this.taskId);
    if (!task) return this.setData({ task: null, points: 0, status: 'todo' });
    const g = app.globalData;
    const dim = (g.dimensions || []).find(item => item.key === task.dim) || {};
    const detail = (g.taskDetail || {})[task.id] || { purpose: '', neigong: '', classic: '', methods: '',
      rewards: [{ name: '完成任务', points: task.points }] };
    this.setData({ task, detail, meta: { dimName: dim.name || '成长任务', dark: dim.dark || '#4F46E5' },
      points: task.points, status: task.done ? 'approved' : 'todo' });
    wx.setNavigationBarTitle({ title: task.name });
  },
  checkin() {
    if (!this.data.task || !this.data.points) return;
    const result = store.setTaskDone(this.taskId, true);
    if (!result) return wx.showToast({ title: '任务不存在', icon: 'none' });
    this.refresh();
    wx.showToast({ title: result.changed ? '打卡 +' + result.delta + ' 分' : '已打卡', icon: 'none' });
  }
});
