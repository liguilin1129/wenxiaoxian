const app = getApp();
const store = require('../../utils/store.js');

Page({
  data: {
    signed: false,
    child: {},
    // 会员数据为占位/mock 时先隐藏，接入真实数据后改为 true
    showVip: false,
    showMember: false,
    pendingApprovals: 0,
    stats: [
      { num: 0, label: '我的任务', action: 'goTasks' },
      { num: 0, label: '账户(¥)', action: 'goPoints' },
      { num: 0, label: '会员卡', action: 'goMembers' },
      { num: 0, label: '积分', action: 'goPoints' },
      { num: 0, label: '券码', action: 'goRewards' },
      { num: 0, label: '收藏', action: 'goClassics' }
    ],
    tools: [
      { icon: '🏆', name: '我的成就', action: 'goReport', bg: '#FFF1F3', color: '#E11D6F' },
      { icon: '🎁', name: '我的奖品', action: 'goRewards', bg: '#ECFDF5', color: '#0F9D6B' },
      { icon: '⚙️', name: '账号设置', action: 'goSettings', bg: '#F5F3FF', color: '#7C3AED' },
      { icon: '🧾', name: '积分明细', action: 'goPoints', bg: '#EEF2FF', color: '#4338CA' },
      { icon: '📊', name: '成长报告', action: 'goReport', bg: '#FFFBEB', color: '#B7791F' },
      { icon: '✏️', name: '编辑资料', action: 'editProfile', bg: '#F0FDFA', color: '#0D9488' }
    ]
  },
  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 3 });
    }
    const signed = !!store.isSigned();
    if (!signed) {
      // 未登录：不展示任何用户信息
      const stats = this.data.stats.map(s => Object.assign({}, s, { num: 0 }));
      this.setData({ signed: false, child: {}, stats: stats });
      return;
    }
    const child = app.globalData.child || {};
    const stats = this.data.stats.slice();
    // 把实际积分和今日已完成任务数展示出来
    stats[3].num = child.points || 0;
    const todayDone = (app.globalData.todayTasks || []).filter(t => t.done).length;
    stats[0].num = todayDone;
    this.setData({ signed: true, child: child, stats: stats, pendingApprovals: store.getPendingApprovals().length });
  },
  goLogin() { wx.navigateTo({ url: '/pages/login/login' }); },
  editProfile() { wx.navigateTo({ url: '/pages/profile-edit/profile-edit' }); },
  goClassics() { wx.navigateTo({ url: '/pages/classics/classics' }); },
  goRewards() { wx.navigateTo({ url: '/pages/rewards/rewards' }); },
  goReport() { wx.navigateTo({ url: '/pages/report/report' }); },
  goPoints() { wx.navigateTo({ url: '/pages/points/points' }); },
  goTasks() { wx.switchTab({ url: '/pages/tasks/tasks' }); },
  goMembers() { wx.navigateTo({ url: '/pages/family/family' }); },
  goApprovals() { wx.navigateTo({ url: '/pages/approvals/approvals' }); },
  goSettings() { wx.showToast({ title: '提醒 · 主题', icon: 'none' }); },
  logout() {
    wx.showModal({
      title: '退出成长花园',
      content: '确定要退出吗？退出后回到游客状态。',
      success: (res) => {
        if (res.confirm) {
          app.globalData.signed = false;
          wx.removeStorageSync('signed');
          wx.reLaunch({ url: '/pages/index/index' });
        }
      }
    });
  }
});
