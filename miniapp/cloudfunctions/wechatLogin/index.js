// 云函数在微信侧执行，可直接读取当前小程序用户的可信 openid，
// 无需服务端请求 api.weixin.qq.com，也无需在客户端保存 AppSecret。
const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

exports.main = async () => {
  const context = cloud.getWXContext();
  if (!context.OPENID) {
    return { ok: false, error: { code: 'OPENID_UNAVAILABLE', message: '无法获取微信用户身份' } };
  }
  return {
    ok: true,
    user: {
      id: context.OPENID,
      unionId: context.UNIONID || ''
    }
  };
};
