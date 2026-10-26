const app = getApp();
const store = require('../../utils/store.js');
Page({
  data: { filter: 'all', view: 'today', groups: [], doneCount: 0, total: 0 },
  onShow() { this.buildGroups(); },
  setFilter(e) { this.setData({ filter: e.currentTarget.dataset.f }); this.buildGroups(); },
  setView(e) { this.setData({ view: e.currentTarget.dataset.view }); this.buildGroups(); },
  goMakeup() { wx.navigateTo({ url: '/pages/makeup-checkin/makeup-checkin' }); },
  buildGroups() {
    const today = store.getTodayTasks();
    const library = this.data.view === 'templates';
    const all = library ? (app.globalData.tasks || []).map(group => Object.assign({}, group, {
      list: group.list.map(task => Object.assign({}, task, { dim: group.dim,
        points: task.rewards.reduce((sum,item) => sum + item.points,0), done: store.isCenterDone(task.id) }))
    })) : (app.globalData.dimensions || []).map(dim => ({ dim: dim.key, dimName: dim.name, list: today.filter(task => task.dim === dim.key) }));
    const groups = all.filter(group => (this.data.filter === 'all' || group.dim === this.data.filter) && group.list.length).map(group => ({
      dim: group.dim, dimName: group.dimName,
      list: group.list.map(task => Object.assign({}, task, { status: task.done ? 'approved' : 'todo',
        tags: task.tags || (task.assignee ? [task.assignee] : []),
        rewards: task.rewards || [{ name: '打卡积分', points: task.points }] }))
    }));
    this.setData({ groups, doneCount: store.todayDoneCount(), total: today.length });
  },
  toggleCenter(e) {
    const id = e.currentTarget.dataset.id;
    const task = store.getTask(id);
    if (task && task.done) return;
    const result = store.setTaskDone(id, true);
    if (!result) return;
    wx.showToast({ title: result.locked ? '已完成' : '打卡 +' + result.delta + ' 分', icon: 'none' });
    this.buildGroups();
  },
  goDetail(e) { wx.navigateTo({ url: '/pages/task-detail/task-detail?id=' + encodeURIComponent(e.currentTarget.dataset.id) }); }
});
