const store = require('../../utils/store');
Page({
  data: { signed: false, isParent: false, child: {}, fields: [], badges: [], badgeGot: 0 },
  onShow() {
    if (!store.isSigned()) return this.setData({ signed: false, child: {}, fields: [], badges: [] });
    const child = getApp().globalData.child || {};
    const badges = store.getBadges();
    this.setData({ signed: true, isParent: store.isParentMode(), child,
      fields: [
        { name: '性别', value: child.gender || '未设置' },
        { name: '生日', value: child.birthday || '未设置' },
        { name: '身高', value: child.height ? child.height + ' cm' : '未设置' },
        { name: '体重', value: child.weight ? child.weight + ' kg' : '未设置' },
        { name: '个性签名', value: child.motto || '未设置' }
      ], badgeGot: badges.filter(item => item.got).length,
      badges: badges.filter(item => item.got).concat(badges.filter(item => !item.got)).slice(0, 4) });
  },
  editProfile() {
    if (!store.isSigned()) return this.goLogin();
    if (!store.isParentMode()) return wx.showToast({ title: '请由家长模式编辑资料', icon: 'none' });
    wx.navigateTo({ url: '/pages/profile-edit/profile-edit' });
  },
  goLogin() { wx.navigateTo({ url: '/pages/login/login' }); },
  goBadges() { wx.navigateTo({ url: '/pages/badges/badges' }); },
  goPoints() { wx.navigateTo({ url: '/pages/points/points' }); }
});
