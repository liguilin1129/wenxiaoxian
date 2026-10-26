// 云函数属于小程序已关联的云开发环境；云托管服务则位于独立的托管环境。
const CLOUD_FUNCTION_ENV_ID = 'cloud1-d6gz2xo6tac43e3eb';
const CLOUD_HOSTING_ENV_ID = 'prod-d1goyv6t9dd0a4923';
const CLOUD_SERVICE = 'express-3rxq';

function isAvailable() {
  return !!(wx.cloud && wx.cloud.callContainer);
}

function init() {
  if (!isAvailable()) return false;
  try {
    wx.cloud.init({ env: CLOUD_FUNCTION_ENV_ID, traceUser: true });
    return true;
  } catch (error) {
    console.error('[cloud-hosting] 初始化失败', error);
    return false;
  }
}

function request(options) {
  if (!isAvailable()) {
    const error = new Error('微信云托管不可用');
    if (options.fail) options.fail(error);
    return;
  }
  wx.cloud.callContainer({
    config: { env: CLOUD_HOSTING_ENV_ID },
    path: options.path,
    method: options.method || 'GET',
    data: options.data || {},
    header: Object.assign({
      'X-WX-SERVICE': CLOUD_SERVICE,
      // 请求云托管网关注入可信的微信用户身份，服务端从 x-wx-openid 读取。
      'X-WX-INCLUDE-CREDENTIALS': 'openid,unionid'
    }, options.header || {}),
    success: options.success,
    fail: options.fail
  });
}

module.exports = { CLOUD_FUNCTION_ENV_ID, CLOUD_HOSTING_ENV_ID, CLOUD_SERVICE, init, request };
