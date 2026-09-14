// 只有开发者工具能访问电脑本机的 127.0.0.1；真机调试也必须走公网 HTTPS 域名。
// 不要在此文件放置 AppSecret、access_token 或任何服务端密钥。
let isDevtools = false;
try {
  isDevtools = wx.getSystemInfoSync().platform === 'devtools';
} catch (error) {}

module.exports = {
  BASE_URL: isDevtools ? 'http://127.0.0.1:3000' : 'https://wenxiaoxian.com'
};
