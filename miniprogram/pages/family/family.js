const app = getApp();
const store = require('../../utils/store.js');

Page({
  data: {
    members: [],
    pendingCount: 0,
    stats: { tasks: 0, rewards: 0 },
    familyProfile: null
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
    this.setData({
      members: store.getFamilyMembers(),
      pendingCount: pending,
      stats: stats,
      familyProfile: store.getFamilyProfile()
    });
  },
  goMeeting() {
    wx.navigateTo({ url: '/pages/family/meeting' });
  },
  goConvention() {
    wx.navigateTo({ url: '/pages/family/convention' });
  },
  goTaskManage() { wx.navigateTo({ url: '/pages/task-manage/task-manage' }); },
  editMember(e) {
    wx.navigateTo({ url: '/pages/family/member-edit?id=' + e.currentTarget.dataset.id });
  },
  addMember() {
    wx.navigateTo({ url: '/pages/family/member-edit?mode=add' });
  },
  copyInviteCode() {
    const code = this.data.familyProfile && this.data.familyProfile.inviteCode;
    if (!code) return;
    wx.setClipboardData({ data: code, success: () => wx.showToast({ title: '邀请码已复制', icon: 'success' }) });
  },
  renewInviteCode() {
    wx.showModal({
      title: '更换家庭邀请码',
      content: '旧邀请码将失效，确定生成一组新的邀请码吗？',
      confirmText: '生成新码',
      success: (res) => {
        if (!res.confirm) return;
        this.setData({ familyProfile: store.refreshFamilyInviteCode() });
        wx.showToast({ title: '已生成新邀请码', icon: 'success' });
      }
    });
  }
});
