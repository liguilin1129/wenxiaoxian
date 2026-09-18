const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const CIRCLES = 'wenxiaoxian_circles';
const MEMBERS = 'wenxiaoxian_circle_members';
const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
const text = (v, n) => typeof v === 'string' ? v.trim().slice(0, n) : '';
function code() { let v = ''; for (let i = 0; i < 6; i++) v += chars[Math.floor(Math.random() * chars.length)]; return v; }
function result(circle, role) { return { id: circle._id, name: circle.name, inviteCode: circle.inviteCode, memberCount: circle.memberCount || 1, role: role || '成员' }; }
async function own(openId) {
  let r;
  try {
    r = await db.collection(MEMBERS).where({ openId }).limit(1).get();
  } catch (error) {
    // 首次使用时成员集合尚未生成，按“尚未加入任何圈子”处理。
    if (error && (error.errCode === -502001 || error.errCode === 'DATABASE_COLLECTION_NOT_EXIST')) return null;
    throw error;
  }
  if (!r.data.length) return null;
  const member = r.data[0];
  const circle = await db.collection(CIRCLES).doc(member.circleId).get();
  return { circle: circle.data, role: member.role };
}
exports.main = async event => {
  const openId = cloud.getWXContext().OPENID;
  if (!openId) return { ok: false, error: '无法识别用户身份' };
  try {
    if (event.action === 'get') { const item = await own(openId); return { ok: true, circle: item ? result(item.circle, item.role) : null }; }
    if (event.action === 'create') {
      const exists = await own(openId); if (exists) return { ok: true, circle: result(exists.circle, exists.role) };
      const id = 'circle_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
      // _id 是数据库保留字段，由 doc(id) 指定，不能再写入 data。
      const circle = { name: text(event.name, 20) || '我的成长圈', inviteCode: code(), ownerOpenId: openId, memberCount: 1, createdAt: db.serverDate() };
      await db.collection(CIRCLES).doc(id).set({ data: circle });
      await db.collection(MEMBERS).doc(id + '_' + openId).set({ data: { circleId: id, openId, role: '管理员', joinedAt: db.serverDate() } });
      return { ok: true, circle: result(Object.assign({ _id: id }, circle), '管理员') };
    }
    if (event.action === 'join') {
      const exists = await own(openId); if (exists) return { ok: false, error: '你已经在一个成长圈中' };
      const inviteCode = text(event.inviteCode, 6).toUpperCase();
      const found = await db.collection(CIRCLES).where({ inviteCode }).limit(1).get();
      if (!found.data.length) return { ok: false, error: '邀请码无效或已失效' };
      const circle = found.data[0];
      await db.collection(MEMBERS).doc(circle._id + '_' + openId).set({ data: { circleId: circle._id, openId, role: '成员', joinedAt: db.serverDate() } });
      await db.collection(CIRCLES).doc(circle._id).update({ data: { memberCount: db.command.inc(1) } });
      circle.memberCount = (circle.memberCount || 1) + 1;
      return { ok: true, circle: result(circle, '成员') };
    }
    if (event.action === 'update') {
      const item = await own(openId);
      if (!item) return { ok: false, error: '请先创建或加入成长圈' };
      if (item.circle.ownerOpenId !== openId) return { ok: false, error: '只有管理员可以编辑成长圈' };
      const name = text(event.name, 20) || item.circle.name;
      const data = { name: name };
      if (event.renewInviteCode) data.inviteCode = code();
      await db.collection(CIRCLES).doc(item.circle._id).update({ data });
      return { ok: true, circle: result(Object.assign({}, item.circle, data), item.role) };
    }
    return { ok: false, error: '不支持的操作' };
  } catch (e) { console.error('[communityCircle]', e); return { ok: false, error: '成长圈服务暂时不可用' }; }
};
