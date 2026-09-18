// 用户成长数据云同步：身份由云函数上下文的 OPENID 确定，
// 客户端不能指定或读取其他用户的数据。
const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();
const COLLECTION = 'wenxiaoxian_user_data';

function errorDetail(error) {
  return String((error && (error.errCode || error.code || error.message)) || 'UNKNOWN').slice(0, 80);
}

function plainObject(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  // 只接收可 JSON 序列化的数据，避免意外写入函数、循环引用等非用户资料内容。
  try { return JSON.parse(JSON.stringify(value)); } catch (error) { return {}; }
}

exports.main = async (event) => {
  const context = cloud.getWXContext();
  const openId = context.OPENID;
  if (!openId) return { ok: false, error: { code: 'OPENID_UNAVAILABLE', message: '无法识别当前微信用户' } };

  if (event.action === 'get') {
    try {
      const result = await db.collection(COLLECTION).doc(openId).get();
      return { ok: true, data: result.data && result.data.snapshot ? result.data.snapshot : null };
    } catch (error) {
      // 云端没有首次数据时按空数据返回；其它错误不泄露服务端细节。
      if (error && (error.errCode === -502005 || error.errCode === 'DATABASE_RECORD_NOT_EXIST')) return { ok: true, data: null };
      console.error('[userDataSync] read failed:', error);
      return { ok: false, error: { code: 'READ_FAILED', message: '暂时无法读取云端数据', detail: errorDetail(error) } };
    }
  }

  if (event.action === 'save') {
    const snapshot = plainObject(event.snapshot);
    if (!Object.keys(snapshot).length) return { ok: false, error: { code: 'EMPTY_SNAPSHOT', message: '没有可保存的成长数据' } };
    try {
      await db.collection(COLLECTION).doc(openId).set({
        data: {
          openId: openId,
          schemaVersion: 1,
          snapshot: snapshot,
          updatedAt: db.serverDate()
        }
      });
      return { ok: true };
    } catch (error) {
      console.error('[userDataSync] save failed:', error);
      return { ok: false, error: { code: 'SAVE_FAILED', message: '暂时无法保存云端数据', detail: errorDetail(error) } };
    }
  }

  return { ok: false, error: { code: 'INVALID_ACTION', message: '不支持的同步操作' } };
};
