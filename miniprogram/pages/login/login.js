const app = getApp();
const store = require('../../utils/store.js');
const apiConfig = require('../../utils/api-config.js');

Page({
  data: { avatarUrl: '', nickname: '', submitting: false },
  onChooseAvatar(e) {
    this.setData({ avatarUrl: e.detail.avatarUrl || '' });
  },
  onNickname(e) {
    this.setData({ nickname: (e.detail.value || '').trim() });
  },
  onWechatLogin() {
    if (!this.data.nickname) return wx.showToast({ title: '请先填写昵称', icon: 'none' });
    if (!apiConfig.BASE_URL) return wx.showToast({ title: '登录服务尚未配置', icon: 'none' });
    this.setData({ submitting: true });
    wx.login({
      success: (loginResult) => {
        if (!loginResult.code) return this.finishLoginError('微信登录失败，请重试');
        wx.request({
          url: apiConfig.BASE_URL + '/api/auth/wechat/login',
          method: 'POST',
          header: { 'Content-Type': 'application/json' },
          data: { loginCode: loginResult.code, profile: { nickname: this.data.nickname, avatarUrl: this.data.avatarUrl } },
          success: (response) => this.finishLogin(response.data),
          fail: () => this.finishLoginError('无法连接登录服务，请稍后重试')
        });
      },
      fail: () => this.finishLoginError('微信登录失败，请重试')
    });
  },
  finishLogin(result) {
    if (!result || !result.ok || !result.user || !result.token) {
      return this.finishLoginError((result && result.error && result.error.message) || '授权失败，请重试');
    }
    const user = result.user;
    const profile = {
      avatar: user.nickname ? user.nickname.slice(0, 1) : '贤',
      avatarUrl: user.avatarUrl || '',
      name: user.nickname,
      phoneNumber: user.phoneNumber || ''
    };
    app.globalData.child = Object.assign({}, app.globalData.child, profile);
    wx.setStorageSync('childProfile', profile);
    wx.setStorageSync('authToken', result.token);
    wx.setStorageSync('authExpiresAt', result.expiresAt);
    store.login();
    wx.reLaunch({ url: '/pages/index/index' });
  },
  finishLoginError(message) {
    this.setData({ submitting: false });
    wx.showToast({ title: message, icon: 'none' });
  }
});
