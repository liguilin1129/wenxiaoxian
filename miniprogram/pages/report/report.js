const app = getApp();

Page({
  data: { dims: [], neigong: [], weekGain: 0 },
  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 2 });
    }
    const g = app.globalData;
    this.setData({
      dims: g.dimensions,
      neigong: g.neigong,
      weekGain: g.child.weekGain
    });
  }
});
