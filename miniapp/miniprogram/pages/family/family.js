const app = getApp();
const store = require('../../utils/store.js');

Page({
  data: {
    members: [],
    child: {},
    pendingCount: 0,
    stats: { tasks: 0, rewards: 0 }
  },
  onShow() {
    this.refresh();
  },
  refresh() {
    const meetings = store.getMeetings() || [];
    const pending = meetings.filter(m => m.status === 'pending').length;
    const stats = meetings.filter(m => m.status === 'done').reduce((acc, m) => {
      m.topics.forEach(t => {
        if (!t.approved) return;
        if (t.type === 'task') acc.tasks++;
        if (t.type === 'reward') acc.rewards++;
      });
      return acc;
    }, { tasks: 0, rewards: 0 });
    const child = app.globalData.child || {};
    const bmi = child.height && child.weight ? (Number(child.weight) / Math.pow(Number(child.height) / 100, 2)).toFixed(1) : '';
    this.setData({
      members: store.getFamilyMembers(),
      child: Object.assign({}, child, { bmi: bmi }),
      pendingCount: pending,
      stats: stats
    });
  },
  goMeeting() {
    wx.navigateTo({ url: '/pages/family/meeting' });
  },
  goConvention() {
    wx.navigateTo({ url: '/pages/family/convention' });
  },
  goTaskManage() { wx.navigateTo({ url: '/pages/task-manage/task-manage' }); },
  goAssessment() { wx.navigateTo({ url: '/pages/assessment/assessment' }); },
  editMember(e) {
    wx.navigateTo({ url: '/pages/family/member-edit?id=' + e.currentTarget.dataset.id });
  },
  addMember() {
    wx.navigateTo({ url: '/pages/family/member-edit?mode=add' });
  }
});
