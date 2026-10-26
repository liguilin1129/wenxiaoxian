const app = getApp();
Page({
  data: { classics: [], courses: [] },
  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) this.getTabBar().setData({ selected: 1 });
    this.setData({
      classics: (app.globalData.classics || []).slice(0, 3).map(item => Object.assign({}, item, {
        pct: item.total > 0 ? Math.min(100, Math.round(item.read / item.total * 100)) : 0
      })),
      courses: (app.globalData.courses || []).map(item => Object.assign({}, item, { mark: String(item.name || '').slice(0, 1) }))
    });
  },
  goClassic(e) { const name = e.currentTarget.dataset.name;
    if (this.data.classics.some(item => item.name === name)) wx.navigateTo({ url: '/pages/classic-read/classic-read?name=' + encodeURIComponent(name) }); },
  goCourse(e) { const course = this.data.courses.find(item => item.id === e.currentTarget.dataset.id);
    if (course) wx.navigateTo({ url: '/pages/case-list/case-list?course=' + encodeURIComponent(course.name) }); },
  goVideoResources() { wx.navigateTo({ url: '/pages/video-resources/video-resources' }); }
});
