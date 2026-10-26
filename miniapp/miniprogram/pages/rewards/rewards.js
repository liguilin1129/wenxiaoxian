const app = getApp();
const store = require('../../utils/store.js');

Page({
  data: { signed: false, isParent: false, points: 0, rewards: [], manage: false },
  onShow() {
    if (!store.isSigned()) return this.setData({ signed: false, isParent: false, points: 0, rewards: [], manage: false });
    store.getTodayTasks();
    const isParent = store.isParentMode();
    this.setData({ signed: true, isParent, manage: isParent && this.data.manage,
      points: app.globalData.child.points, rewards: app.globalData.rewards });
  },
  goLogin() { wx.navigateTo({ url: '/pages/login/login' }); },
  goPoints() { if (!store.isSigned()) return this.goLogin(); wx.navigateTo({ url: '/pages/points/points' }); },
  toggleManage() {
    if (!store.isSigned() || !store.isParentMode()) return;
    this.setData({ manage: !this.data.manage });
  },
  redeem(e) {
    if (!store.isSigned()) return this.goLogin();
    if (this.data.manage) return;
    const id = e.currentTarget.dataset.id;
    const reward = app.globalData.rewards.find(r => r.id === id);
    if (!reward) return;
    const res = store.redeem(reward);
    if (res.ok) {
      wx.showToast({ title: '兑换成功', icon: 'success' });
      this.setData({ points: res.points });
    } else {
      wx.showToast({ title: res.msg, icon: 'none' });
    }
  },
  addReward() {
    if (!store.isSigned() || !store.isParentMode()) return;
    wx.navigateTo({ url: '/pages/reward-edit/reward-edit?mode=add' });
  },
  editReward(e) {
    if (!store.isSigned() || !store.isParentMode()) return;
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: '/pages/reward-edit/reward-edit?mode=edit&id=' + id });
  },
  deleteReward(e) {
    if (!store.isSigned() || !store.isParentMode()) return;
    const id = e.currentTarget.dataset.id;
    const reward = app.globalData.rewards.find(r => r.id === id);
    if (!reward) return;
    const that = this;
    wx.showModal({
      title: '删除心愿',
      content: '确定删除「' + reward.name + '」？',
      confirmColor: '#E11D6F',
      success(res) {
        if (res.confirm) {
          const list = app.globalData.rewards.filter(r => r.id !== id);
          store.saveRewards(list);
          that.setData({ rewards: list });
          wx.showToast({ title: '已删除', icon: 'none' });
        }
      }
    });
  }
});
