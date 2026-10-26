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
    const name = e.currentTarget.dataset.name;
    wx.navigateTo({ url: '/pages/classic-read/classic-read?name=' + encodeURIComponent(name) });
  }
});
