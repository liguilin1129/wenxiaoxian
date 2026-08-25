const app = getApp();
const store = require('../../utils/store.js');

Page({
  data: {
    members: [
      { name: '爸爸', role: '家长', avatar: '爸', bg: '#EEF2FF', color: '#4338CA' },
      { name: '妈妈', role: '家长', avatar: '妈', bg: '#FFF1F3', color: '#E11D6F' },
      { name: '文小贤', role: '孩子', avatar: '贤', bg: '#ECFDF5', color: '#0F9D6B' }
    ],
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
    this.setData({ pendingCount: pending, stats: stats });
  },
  goMeeting() {
    wx.navigateTo({ url: '/pages/family/meeting' });
  },
  goConvention() {
    wx.showToast({ title: '家庭公约稍后上线', icon: 'none' });
  }
});
