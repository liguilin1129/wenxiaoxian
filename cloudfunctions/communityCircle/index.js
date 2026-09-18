const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const CIRCLES = 'wenxiaoxian_circles';
const MEMBERS = 'wenxiaoxian_circle_members';
const POSTS = 'wenxiaoxian_circle_posts';
const LIKES = 'wenxiaoxian_circle_likes';
const COMMENTS = 'wenxiaoxian_circle_comments';
const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
const text = (value, length) => typeof value === 'string' ? value.trim().slice(0, length) : '';

function code() { let value = ''; for (let i = 0; i < 6; i++) value += chars[Math.floor(Math.random() * chars.length)]; return value; }
function circleResult(circle, role) { return { id: circle._id, name: circle.name, inviteCode: circle.inviteCode, memberCount: circle.memberCount || 1, role: role || '成员' }; }
function displayName(event) { return text(event.authorName, 12) || '成长伙伴'; }

async function own(openId) {
  let result;
  try { result = await db.collection(MEMBERS).where({ openId }).limit(1).get(); }
  catch (error) { if (error && (error.errCode === -502001 || error.errCode === 'DATABASE_COLLECTION_NOT_EXIST')) return null; throw error; }
  if (!result.data.length) return null;
  const member = result.data[0];
  const circle = await db.collection(CIRCLES).doc(member.circleId).get();
  return { circle: circle.data, member };
}

async function requirePost(openId, postId) {
  const item = await own(openId);
  if (!item) return { error: '请先创建或加入成长圈' };
  const found = await db.collection(POSTS).doc(postId).get();
  if (!found.data || found.data.circleId !== item.circle._id) return { error: '该动态不属于当前成长圈' };
  return { item, post: found.data };
}

async function listPosts(item, openId) {
  const found = await db.collection(POSTS).where({ circleId: item.circle._id }).limit(50).get();
  return Promise.all(found.data.map(async post => {
    const liked = await db.collection(LIKES).doc(post._id + '_' + openId).get().then(() => true).catch(() => false);
    return Object.assign({}, post, { id: post._id, liked, time: post.time || '刚刚' });
  }));
}

exports.main = async event => {
  const openId = cloud.getWXContext().OPENID;
  if (!openId) return { ok: false, error: '无法识别用户身份' };
  try {
    if (event.action === 'get') { const item = await own(openId); return { ok: true, circle: item ? circleResult(item.circle, item.member.role) : null }; }
    if (event.action === 'create') {
      const exists = await own(openId); if (exists) return { ok: true, circle: circleResult(exists.circle, exists.member.role) };
      const id = 'circle_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
      const circle = { name: text(event.name, 20) || '我的成长圈', inviteCode: code(), ownerOpenId: openId, memberCount: 1, createdAt: db.serverDate() };
      await db.collection(CIRCLES).doc(id).set({ data: circle });
      await db.collection(MEMBERS).doc(id + '_' + openId).set({ data: { circleId: id, openId, role: '管理员', displayName: displayName(event), joinedAt: db.serverDate() } });
      return { ok: true, circle: circleResult(Object.assign({ _id: id }, circle), '管理员') };
    }
    if (event.action === 'join') {
      const exists = await own(openId); if (exists) return { ok: false, error: '你已经在一个成长圈中' };
      const inviteCode = text(event.inviteCode, 6).toUpperCase(); const found = await db.collection(CIRCLES).where({ inviteCode }).limit(1).get();
      if (!found.data.length) return { ok: false, error: '邀请码无效或已失效' };
      const circle = found.data[0];
      await db.collection(MEMBERS).doc(circle._id + '_' + openId).set({ data: { circleId: circle._id, openId, role: '成员', displayName: displayName(event), joinedAt: db.serverDate() } });
      await db.collection(CIRCLES).doc(circle._id).update({ data: { memberCount: db.command.inc(1) } });
      circle.memberCount = (circle.memberCount || 1) + 1;
      return { ok: true, circle: circleResult(circle, '成员') };
    }
    if (event.action === 'update') {
      const item = await own(openId); if (!item) return { ok: false, error: '请先创建或加入成长圈' };
      if (item.circle.ownerOpenId !== openId) return { ok: false, error: '只有管理员可以编辑成长圈' };
      const data = { name: text(event.name, 20) || item.circle.name }; if (event.renewInviteCode) data.inviteCode = code();
      await db.collection(CIRCLES).doc(item.circle._id).update({ data });
      return { ok: true, circle: circleResult(Object.assign({}, item.circle, data), item.member.role) };
    }
    if (event.action === 'listPosts') {
      const item = await own(openId); if (!item) return { ok: false, error: '请先创建或加入成长圈' };
      return { ok: true, posts: await listPosts(item, openId) };
    }
    if (event.action === 'publish') {
      const item = await own(openId); if (!item) return { ok: false, error: '请先创建或加入成长圈' };
      const content = text(event.content, 300); if (!content) return { ok: false, error: '请输入动态内容' };
      const id = 'post_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
      const post = { circleId: item.circle._id, authorOpenId: openId, name: displayName(event), avatar: text(event.avatar, 2) || '我', text: content, tag: text(event.tag, 12) || '成长记录', likeCount: 0, commentCount: 0, time: '刚刚', createdAt: db.serverDate() };
      await db.collection(POSTS).doc(id).set({ data: post });
      return { ok: true, post: Object.assign({ id }, post, { liked: false }) };
    }
    if (event.action === 'toggleLike') {
      const checked = await requirePost(openId, text(event.postId, 80)); if (checked.error) return { ok: false, error: checked.error };
      const likeId = checked.post._id + '_' + openId; const existing = await db.collection(LIKES).doc(likeId).get().then(() => true).catch(() => false);
      if (existing) { await db.collection(LIKES).doc(likeId).remove(); await db.collection(POSTS).doc(checked.post._id).update({ data: { likeCount: db.command.inc(-1) } }); }
      else { await db.collection(LIKES).doc(likeId).set({ data: { postId: checked.post._id, openId, createdAt: db.serverDate() } }); await db.collection(POSTS).doc(checked.post._id).update({ data: { likeCount: db.command.inc(1) } }); }
      return { ok: true, liked: !existing, likeCount: Math.max(0, (checked.post.likeCount || 0) + (existing ? -1 : 1)) };
    }
    if (event.action === 'listComments') {
      const checked = await requirePost(openId, text(event.postId, 80)); if (checked.error) return { ok: false, error: checked.error };
      const found = await db.collection(COMMENTS).where({ postId: checked.post._id }).limit(100).get();
      return { ok: true, comments: found.data.map(comment => Object.assign({}, comment, { id: comment._id, time: comment.time || '刚刚' })) };
    }
    if (event.action === 'comment') {
      const checked = await requirePost(openId, text(event.postId, 80)); if (checked.error) return { ok: false, error: checked.error };
      const content = text(event.content, 100); if (!content) return { ok: false, error: '请输入评论内容' };
      const id = 'comment_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
      const comment = { postId: checked.post._id, authorOpenId: openId, name: displayName(event), avatar: text(event.avatar, 2) || '我', text: content, time: '刚刚', createdAt: db.serverDate() };
      await db.collection(COMMENTS).doc(id).set({ data: comment }); await db.collection(POSTS).doc(checked.post._id).update({ data: { commentCount: db.command.inc(1) } });
      return { ok: true, comment: Object.assign({ id }, comment) };
    }
    if (event.action === 'members') {
      const item = await own(openId); if (!item) return { ok: false, error: '请先创建或加入成长圈' };
      const found = await db.collection(MEMBERS).where({ circleId: item.circle._id }).get();
      return { ok: true, isOwner: item.circle.ownerOpenId === openId, members: found.data.map(member => ({ id: member._id, name: member.displayName || (member.role === '管理员' ? '管理员' : '成长伙伴'), role: member.role, avatar: (member.displayName || '成').slice(0, 1), isSelf: member.openId === openId })) };
    }
    if (event.action === 'leave') {
      const item = await own(openId); if (!item) return { ok: false, error: '你尚未加入成长圈' };
      if (item.circle.ownerOpenId === openId) return { ok: false, error: '管理员不能退出，请先转让管理员' };
      await db.collection(MEMBERS).doc(item.member._id).remove(); await db.collection(CIRCLES).doc(item.circle._id).update({ data: { memberCount: db.command.inc(-1) } });
      return { ok: true };
    }
    if (event.action === 'removeMember') {
      const item = await own(openId); if (!item || item.circle.ownerOpenId !== openId) return { ok: false, error: '只有管理员可以移除成员' };
      const found = await db.collection(MEMBERS).doc(text(event.memberId, 160)).get();
      if (!found.data || found.data.circleId !== item.circle._id || found.data.openId === openId) return { ok: false, error: '不能移除该成员' };
      await db.collection(MEMBERS).doc(found.data._id).remove(); await db.collection(CIRCLES).doc(item.circle._id).update({ data: { memberCount: db.command.inc(-1) } });
      return { ok: true };
    }
    return { ok: false, error: '不支持的操作' };
  } catch (error) { console.error('[communityCircle]', error); return { ok: false, error: '成长圈服务暂时不可用' }; }
};
