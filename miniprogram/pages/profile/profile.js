const app = getApp();
const store = require('../../utils/store.js');

Page({
  data: {
    signed: false,
    child: {},
    pendingApprovals: 0,
    stats: [
      { num: 0, label: '今日任务', action: 'goTasks' },
      { num: 0, label: '成长积分', action: 'goPoints' },
      { num: 0, suffix: '天', label: '连续打卡', action: 'goReport' }
    ],
    tools: [
      { icon: '📊', name: '成长报告', action: 'goReport', bg: '#FFFBEB', color: '#B7791F' },
      { icon: '🎁', name: '奖励兑换', action: 'goRewards', bg: '#ECFDF5', color: '#0F9D6B' },
      { icon: '✅', name: '家长确认', action: 'goApprovals', bg: '#F5F3FF', color: '#7C3AED' },
      { icon: '📖', name: '经典书架', action: 'goClassics', bg: '#EEF2FF', color: '#4338CA' }
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
    const stats = this.data.stats.map(item => Object.assign({}, item));
    const todayDone = (app.globalData.todayTasks || []).filter(t => t.done).length;
    stats[0].num = todayDone;
    stats[1].num = child.points || 0;
    stats[2].num = child.streak || 0;
    const pendingApprovals = store.getPendingApprovals().length;
    const tools = this.data.tools.map(item => Object.assign({}, item, {
      badge: item.action === 'goApprovals' && pendingApprovals ? pendingApprovals : 0
    }));
    const age = child.birthday ? Math.max(0, new Date().getFullYear() - Number(String(child.birthday).slice(0, 4))) : '';
    const bmi = child.height && child.weight ? (Number(child.weight) / Math.pow(Number(child.height) / 100, 2)).toFixed(1) : '';
    this.setData({ signed: true, child: Object.assign({}, child, { age: age, bmi: bmi }), stats: stats, tools: tools, pendingApprovals: pendingApprovals });
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
