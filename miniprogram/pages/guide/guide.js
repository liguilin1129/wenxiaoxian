const app = getApp();
const store = require('../../utils/store.js');

Page({
  data: { dims: [] },
  onLoad() {
    if (store.isSigned()) {
      wx.reLaunch({ url: '/pages/index/index' });
      return;
    }
    this.setData({ dims: app.globalData.dimensions });
  },
  start() {
    store.signContract();
    wx.reLaunch({ url: '/pages/index/index' });
  }
});
