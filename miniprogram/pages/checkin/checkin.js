const app = getApp();
const store = require('../../utils/store.js');

const WEEK = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

function dimNameMap() {
  const m = {};
  app.globalData.dimensions.forEach(d => { m[d.key] = d.name; });
  return m;
}

Page({
  data: { tasks: [], pendingTasks: [], completedTasks: [], recentRecords: [], gain: 0, done: 0, total: 0, progressPct: 0, encouragement: '', dimName: {}, today: '' },
  onShow() { this.refresh(); },
  refresh() {
    const g = app.globalData;
    const d = new Date();
    const today = d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2) + ' ' + WEEK[d.getDay()];
    const tasks = g.todayTasks;
    const done = store.todayDoneCount();
    const total = tasks.length;
    const goalMap = {};
    store.getGrowthGoals().filter(goal => goal.status === 'active').forEach(goal => { goalMap[goal.id] = goal; });
    const indexedTasks = tasks.map((task, index) => {
      const goal = task.goalId && goalMap[task.goalId];
      return Object.assign({
        index: index,
        approvalText: task.requiresApproval ? (task.pendingApproval ? '等待家长确认' : '需家长确认') : '',
        goalName: goal ? goal.name : '',
        goalProgress: goal && goal.stage ? ('第 ' + (goal.currentStage + 1) + ' 阶段 · ' + goal.stage.progress + '/' + goal.stage.target) : ''
      }, task);
    });
    const progressPct = total ? Math.round(done / total * 100) : 0;
    const encouragement = total === 0 ? '今天还没有安排任务' : (done === total ? '今日圆满，明天继续保持' : ('再完成 ' + (total - done) + ' 项，就能点亮今天'));
    this.setData({
      tasks: tasks,
      pendingTasks: indexedTasks.filter(task => !task.done),
      completedTasks: indexedTasks.filter(task => task.done),
      recentRecords: store.getAiCheckinRecords(8),
      gain: store.todayGain(),
      done: done,
      total: total,
      progressPct: progressPct,
      encouragement: encouragement,
      dimName: dimNameMap(),
      today: today
    });
  },
  toggle(e) {
    const index = e.currentTarget.dataset.index;
    const res = store.toggleTodayTask(index);
    if (res) {
      if (res.locked) {
        wx.showToast({ title: 'AI 打卡记录不能在此取消', icon: 'none' });
        return;
      }
      if (res.pending) {
        wx.showToast({ title: '已提交，等待家长确认', icon: 'none' });
        this.refresh();
        return;
      }
      const tip = res.goalUpdate && res.goalUpdate.completed ? (res.goalUpdate.goal.done ? '成长目标已达成！' : '本阶段完成，已解锁下一阶段') : (res.delta > 0 ? '打卡 +' + res.delta + ' 分' : '已取消打卡');
      wx.showToast({ title: tip, icon: 'none' });
      this.refresh();
    }
  }
});
