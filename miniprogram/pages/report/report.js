const app = getApp();

Page({
  data: { dims: [], neigong: [], weekGain: 0 },
  onShow() {
    const g = app.globalData;
    this.setData({
      dims: g.dimensions,
      neigong: g.neigong,
      weekGain: g.child.weekGain
    });
  }
});
