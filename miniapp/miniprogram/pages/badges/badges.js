const store = require('../../utils/store.js');
const app = getApp();

Page({
  data: { badges: [], got: 0, total: 0, child: {} },
  onShow() { this.refresh(); },
  refresh() {
    const badges = store.getBadges();
    this.setData({ badges, got: badges.filter(item => item.got).length, total: badges.length, child: app.globalData.child || {} });
  },
  showBadge(e) {
    const badge = e.currentTarget.dataset.badge;
    wx.showModal({ title: badge.name, content: badge.got ? '已获得：' + badge.desc : '解锁条件：' + badge.desc + '\n当前进度：' + badge.displayValue + '/' + badge.target + badge.unit, showCancel: false });
  }
});
