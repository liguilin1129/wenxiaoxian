const app = getApp();

Page({
  data: { child: {} },
  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 3 });
    }
    this.setData({ child: app.globalData.child });
  },
  editProfile() { wx.navigateTo({ url: '/pages/profile-edit/profile-edit' }); },
  goClassics() { wx.navigateTo({ url: '/pages/classics/classics' }); },
  goRewards() { wx.navigateTo({ url: '/pages/rewards/rewards' }); },
  goReport() { wx.navigateTo({ url: '/pages/report/report' }); },
  goPoints() { wx.navigateTo({ url: '/pages/points/points' }); },
  goMembers() { wx.showToast({ title: '爸爸 · 妈妈', icon: 'none' }); },
  goSettings() { wx.showToast({ title: '提醒 · 主题', icon: 'none' }); },
  logout() {
    wx.showModal({
      title: '退出成长花园',
      content: '确定要退出吗？下次打开需重新签订合约。',
      success: (res) => {
        if (res.confirm) {
          app.globalData.signed = false;
          wx.removeStorageSync('signed');
          wx.reLaunch({ url: '/pages/guide/guide' });
        }
      }
    });
  }
});
