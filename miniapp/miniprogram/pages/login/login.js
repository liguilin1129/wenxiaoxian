const app = getApp();
const store = require('../../utils/store.js');
const apiConfig = require('../../utils/api-config.js');
const cloudHosting = require('../../utils/cloud-hosting.js');

Page({
  data: { submitting: false },
  onWechatLogin() {
    if (this.data.submitting) return;
    if (!apiConfig.USE_CLOUD_HOSTING && !apiConfig.BASE_URL) return wx.showToast({ title: '登录服务尚未配置', icon: 'none' });
    this.setData({ submitting: true });
    this.requestWechatLogin();
  },
  requestWechatLogin() {
    wx.login({
      success: (loginResult) => {
        if (!loginResult.code) return this.finishLoginError('微信登录失败，请重试');
        const requestOptions = {
          method: 'POST',
          header: { 'Content-Type': 'application/json' },
          data: { loginCode: loginResult.code, profile: {} },
          success: (response) => this.finishLogin(response.data),
          fail: (error) => this.handleServiceError(error)
        };
        if (apiConfig.USE_CLOUD_HOSTING) {
          requestOptions.path = '/api/auth/wechat/login';
          cloudHosting.request(requestOptions);
        } else {
          requestOptions.url = apiConfig.BASE_URL + '/api/auth/wechat/login';
          wx.request(requestOptions);
        }
      },
      fail: (error) => {
        console.error('[login] wx.login 失败:', (error && error.errMsg) || 'unknown error');
        this.finishLoginError('微信登录失败，请重试');
      }
    });
  },
  handleServiceError(error, title) {
    const detail = (error && error.errMsg) || 'unknown error';
    // 云托管连接失败时，保留平台返回的诊断信息；不要记录登录码或令牌。
    console.error('[login] 登录服务请求失败:', detail);
    this.finishLoginError('无法连接登录服务，请稍后重试');
    wx.showModal({
      title: title || '登录服务连接失败',
      content: detail.slice(0, 180),
      showCancel: false
    });
  },
  finishLogin(result) {
    if (!result || !result.ok || !result.user || !result.user.id || typeof result.token !== 'string' || !result.token) {
      return this.finishLoginError((result && result.error && result.error.message) || '授权失败，请重试');
    }
    const user = result.user;
    const profile = {
      avatar: user.nickname ? user.nickname.slice(0, 1) : '贤',
      avatarUrl: user.avatarUrl || '',
      name: user.nickname || '微信用户',
      phoneNumber: user.phoneNumber || ''
    };
    app.globalData.child = Object.assign({}, app.globalData.child, profile);
    wx.setStorageSync('childProfile', profile);
    wx.setStorageSync('authToken', result.token);
    wx.setStorageSync('authExpiresAt', result.expiresAt);
    store.login();
    this.setData({ submitting: false });
    wx.reLaunch({ url: '/pages/index/index' });
  },
  finishLoginError(message) {
    this.setData({ submitting: false });
    wx.showToast({ title: message, icon: 'none' });
  }
});
