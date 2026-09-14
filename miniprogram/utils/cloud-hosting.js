// 微信云托管内部调用配置。服务与小程序绑定后，真机无需公网域名和 HTTPS 白名单。
const CLOUD_ENV_ID = 'prod-d1goyv6t9dd0a4923';
const CLOUD_SERVICE = 'express-3rxq';

function isAvailable() {
  return !!(wx.cloud && wx.cloud.callContainer);
}

function init() {
  if (!isAvailable()) return false;
  try {
    wx.cloud.init({ env: CLOUD_ENV_ID, traceUser: true });
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
    config: { env: CLOUD_ENV_ID },
    path: options.path,
    method: options.method || 'GET',
    data: options.data || {},
    header: Object.assign({ 'X-WX-SERVICE': CLOUD_SERVICE }, options.header || {}),
    success: options.success,
    fail: options.fail
  });
}

module.exports = { CLOUD_ENV_ID, CLOUD_SERVICE, init, request };
