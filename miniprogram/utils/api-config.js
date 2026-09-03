// 开发者工具在本机调试时访问本地服务；体验版与正式版使用已配置的 HTTPS 域名。
// 不要在此文件放置 AppSecret、access_token 或任何服务端密钥。
let envVersion = 'release';
try {
  envVersion = wx.getAccountInfoSync().miniProgram.envVersion;
} catch (error) {}

module.exports = {
  BASE_URL: envVersion === 'develop' ? 'http://127.0.0.1:3000' : 'https://wenxiaoxian.com'
};
