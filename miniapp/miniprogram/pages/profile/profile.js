const app = getApp();
const store = require('../../utils/store.js');

Page({
  data: {
    signed: false,
    mode: 'parent',
    child: {},
    stats: [
      { num: 0, label: '今日任务', action: 'goTasks' },
      { num: 0, label: '成长积分', action: 'goPoints' },
      { num: 0, suffix: '天', label: '连续打卡', action: 'goCheckinRecord' }
    ],
    tools: [
      { icon: '🏦', name: '成长银行', action: 'goBank', bg: '#ECECFF', color: '#5E5CE6' },
      { icon: '👨‍👩‍👦', name: '家庭空间', action: 'goFamily', bg: '#FFF2E8', color: '#B76A35', parentOnly: true },
      { icon: '🛍️', name: '官方商城', action: 'goShop', bg: '#ECF9F1', color: '#25825A' },
      { icon: '👨', name: '使用模式', action: 'goMode', bg: '#EEF2FF', color: '#4338CA' }
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
    store.getTodayTasks();
    const child = app.globalData.child || {};
    const stats = this.data.stats.map(item => Object.assign({}, item));
    const todayDone = (app.globalData.todayTasks || []).filter(t => t.done).length;
    stats[0].num = todayDone;
    stats[1].num = child.points || 0;
    stats[2].num = child.streak || 0;
    const mode = store.getAppMode();
    const tools = this.data.tools.filter(item => mode === 'parent' || !item.parentOnly);
    const age = child.birthday ? Math.max(0, new Date().getFullYear() - Number(String(child.birthday).slice(0, 4))) : '';
    const bmi = child.height && child.weight ? (Number(child.weight) / Math.pow(Number(child.height) / 100, 2)).toFixed(1) : '';
    this.setData({ signed: true, mode, child: Object.assign({}, child, { age: age, bmi: bmi }), stats: stats, tools: tools });
  },
  goLogin() { wx.navigateTo({ url: '/pages/login/login' }); },
  editProfile() { if (!store.isParentMode()) return wx.showToast({ title: '请由家长模式编辑资料', icon: 'none' }); wx.navigateTo({ url: '/pages/profile-edit/profile-edit' }); },
  goShop() { wx.navigateTo({ url: '/pages/shop/shop' }); },
  goPoints() { wx.navigateTo({ url: '/pages/points/points' }); },
  goBank() { wx.navigateTo({ url: '/pages/growth-bank/growth-bank' }); },
  goCheckinRecord() { wx.navigateTo({ url: '/pages/checkin-record/checkin-record' }); },
  goTasks() { wx.navigateTo({ url: '/pages/tasks/tasks' }); },
  goFamily() { wx.navigateTo({ url: '/pages/family/family' }); },
  goMembers() { wx.navigateTo({ url: '/pages/family/family' }); },
  goMode() { wx.navigateTo({ url: '/pages/app-mode/app-mode' }); },
  goSettings() { wx.showToast({ title: '提醒 · 主题', icon: 'none' }); },
  switchMode(e) { const mode = store.setAppMode(e.currentTarget.dataset.mode); this.setData({ mode }); wx.showToast({ title: mode === 'child' ? '已切换为孩子模式' : '已切换为家长模式', icon: 'none' }); this.onShow(); },
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
