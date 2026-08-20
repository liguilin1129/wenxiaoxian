const app = getApp();
const store = require('../../utils/store.js');

Page({
  data: { points: 0, rewards: [] },
  onShow() {
    this.setData({ points: app.globalData.child.points, rewards: app.globalData.rewards });
  },
  redeem(e) {
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
  }
});
