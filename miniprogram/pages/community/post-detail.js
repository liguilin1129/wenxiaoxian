const app = getApp();
const { findCommunityPost } = require('../../utils/community-data.js');

function commentsKey(id) { return 'communityPostComments_' + id; }
function defaultComments(post) {
  if (String(post.id) === '1') return [{ name: '乐乐爸', avatar: '乐', text: '坚持晨读太棒了！', time: '刚刚' }];
  if (String(post.id) === '2') return [{ name: '糖糖妈', avatar: '糖', text: '这个沟通方法很实用，收藏了。', time: '刚刚' }];
  return [];
}

Page({
  data: { post: null, comments: [], commentText: '' },
  onLoad(query) {
    const post = findCommunityPost(query.id);
    if (!post) {
      wx.showToast({ title: '帖子不存在或已删除', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 700);
      return;
    }
    const stored = wx.getStorageSync(commentsKey(post.id));
    this.setData({ post: post, comments: Array.isArray(stored) ? stored : defaultComments(post) });
  },
  previewMedia(e) {
    const list = e.currentTarget.dataset.list || [];
    const current = Number(e.currentTarget.dataset.index) || 0;
    wx.previewMedia({ sources: list.map(item => ({ url: item.path, type: item.type, poster: item.thumb })), current: current });
  },
  inputComment(e) { this.setData({ commentText: e.detail.value }); },
  sendComment() {
    const text = this.data.commentText.trim();
    if (!text) return wx.showToast({ title: '写点想法再发送吧', icon: 'none' });
    const child = app.globalData.child || {};
    const comment = { name: child.name || '我', avatar: child.avatar || '我', text: text, time: '刚刚' };
    const comments = this.data.comments.concat(comment);
    wx.setStorageSync(commentsKey(this.data.post.id), comments);
    this.setData({ comments: comments, commentText: '' });
  }
});
