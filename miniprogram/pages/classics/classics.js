const app = getApp();

Page({
  data: { classics: [] },
  onShow() {
    const classics = app.globalData.classics.map(c => {
      const pct = c.read >= c.total ? 100 : Math.round(c.read / c.total * 100);
      return Object.assign({}, c, { pct: pct });
    });
    this.setData({ classics: classics });
  },
  goDetail(e) {
    wx.showToast({ title: '开始诵读《' + e.currentTarget.dataset.name + '》', icon: 'none' });
  }
});
