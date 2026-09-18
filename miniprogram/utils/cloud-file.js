// 云存储文件工具：用户发布的内容优先保存到云端，失败时由调用方保留本地文件兜底。
const ENV_ID = 'cloud1-d6gz2xo6tac43e3eb';
let initialized = false;

function init() {
  if (initialized) return true;
  if (!wx.cloud || !wx.cloud.init || !wx.cloud.uploadFile) return false;
  try {
    wx.cloud.init({ env: ENV_ID, traceUser: true });
    initialized = true;
    return true;
  } catch (error) {
    console.error('[cloud-file] 初始化失败', error);
    return false;
  }
}

function extension(filePath, type) {
  const matched = String(filePath || '').match(/\.([a-zA-Z0-9]{1,8})(?:\?.*)?$/);
  if (matched) return matched[1].toLowerCase();
  return type === 'video' ? 'mp4' : 'jpg';
}

function upload(filePath, folder, type) {
  if (!filePath || /^cloud:\/\//.test(filePath)) return Promise.resolve(filePath || '');
  if (!init()) return Promise.resolve('');
  const cloudPath = (folder || 'uploads') + '/' + Date.now() + '_' + Math.random().toString(36).slice(2, 8) + '.' + extension(filePath, type);
  return new Promise(resolve => {
    wx.cloud.uploadFile({
      cloudPath: cloudPath,
      filePath: filePath,
      success: res => resolve((res && res.fileID) || ''),
      fail: error => {
        console.error('[cloud-file] 上传失败', error);
        resolve('');
      }
    });
  });
}

module.exports = { upload };
