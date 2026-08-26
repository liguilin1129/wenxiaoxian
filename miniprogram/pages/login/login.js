const app = getApp();
const store = require('../../utils/store.js');

// 可选头像（默认"贤"文字头像 + 一组可爱 emoji）
const AVATARS = ['贤', '🦊', '🐱', '🐰', '🐻', '🦁', '🐼', '🐯', '🐶', '🐸', '🦄', '🌟', '🍎'];

Page({
  data: {
    avatars: AVATARS,
    avatar: '贤',
    name: ''
  },
  pickAvatar(e) {
    this.setData({ avatar: e.currentTarget.dataset.a });
  },
  onName(e) {
    this.setData({ name: e.detail.value });
  },
  // 轻量登录：只做资料设置，不再强制家庭会议签约
  enter() {
    const name = this.data.name.trim();
    if (!name) {
      wx.showToast({ title: '请填写昵称', icon: 'none' });
      return;
    }
    const profile = { avatar: this.data.avatar, name: name };
    // 同步到全局 + 本地持久化（刷新不丢）
    app.globalData.child = Object.assign({}, app.globalData.child, profile);
    wx.setStorageSync('childProfile', profile);
    store.login(); // 标记已登录（与家庭会议解耦）
    wx.reLaunch({ url: '/pages/index/index' });
  }
});
