const app = getApp();
const circle = require('../../utils/community-circle.js');

function profile() {
  const child = app.globalData.child || {};
  return { authorName: child.name || '成长伙伴', avatar: (child.avatar || child.name || '我').slice(0, 1) };
}

Page({
  data: { tab: 'feed', posts: [], members: [], isOwner: false, content: '', commentText: '', activePost: null, comments: [], loading: true },
  onLoad(query) { this.setData({ tab: query.tab === 'members' ? 'members' : 'feed' }); },
  onShow() { this.load(); },
  noop() {},
  async load() {
    this.setData({ loading: true });
    if (this.data.tab === 'members') await this.loadMembers(); else await this.loadFeed();
    this.setData({ loading: false });
  },
  async loadFeed() {
    const result = await circle.listPosts();
    if (!result.ok) return wx.showToast({ title: result.error, icon: 'none' });
    this.setData({ posts: result.posts || [] });
  },
  async loadMembers() {
    const result = await circle.members();
    if (!result.ok) return wx.showToast({ title: result.error, icon: 'none' });
    this.setData({ members: result.members || [], isOwner: !!result.isOwner });
  },
  changeTab(e) {
    const tab = e.currentTarget.dataset.tab;
    if (tab === this.data.tab) return;
    this.setData({ tab, activePost: null, comments: [] });
    this.load();
  },
  inputContent(e) { this.setData({ content: e.detail.value }); },
  async publish() {
    const content = this.data.content.trim();
    if (!content) return wx.showToast({ title: '写点成长动态再发布吧', icon: 'none' });
    wx.showLoading({ title: '发布中…', mask: true });
    const result = await circle.publish(Object.assign({ content }, profile()));
    wx.hideLoading();
    if (!result.ok) return wx.showToast({ title: result.error, icon: 'none' });
    this.setData({ content: '', posts: [result.post].concat(this.data.posts) });
    wx.showToast({ title: '已发布', icon: 'success' });
  },
  async toggleLike(e) {
    const id = e.currentTarget.dataset.id;
    const result = await circle.toggleLike(id);
    if (!result.ok) return wx.showToast({ title: result.error, icon: 'none' });
    this.setData({ posts: this.data.posts.map(post => post.id === id ? Object.assign({}, post, { liked: result.liked, likeCount: result.likeCount }) : post) });
  },
  async openComments(e) {
    const id = e.currentTarget.dataset.id;
    const post = this.data.posts.find(item => item.id === id);
    if (!post) return;
    const result = await circle.listComments(id);
    if (!result.ok) return wx.showToast({ title: result.error, icon: 'none' });
    this.setData({ activePost: post, comments: result.comments || [], commentText: '' });
  },
  closeComments() { this.setData({ activePost: null, comments: [], commentText: '' }); },
  inputComment(e) { this.setData({ commentText: e.detail.value }); },
  async sendComment() {
    const content = this.data.commentText.trim();
    const post = this.data.activePost;
    if (!content || !post) return wx.showToast({ title: '写点想法再发送吧', icon: 'none' });
    const result = await circle.comment(Object.assign({ postId: post.id, content }, profile()));
    if (!result.ok) return wx.showToast({ title: result.error, icon: 'none' });
    const comments = this.data.comments.concat(result.comment);
    this.setData({ comments, commentText: '', posts: this.data.posts.map(item => item.id === post.id ? Object.assign({}, item, { commentCount: (item.commentCount || 0) + 1 }) : item) });
  },
  removeMember(e) {
    const member = e.currentTarget.dataset.member;
    wx.showModal({ title: '移除成员', content: '确定将“' + member.name + '”移出成长圈吗？', success: async res => {
      if (!res.confirm) return;
      const result = await circle.removeMember(member.id);
      if (!result.ok) return wx.showToast({ title: result.error, icon: 'none' });
      this.setData({ members: this.data.members.filter(item => item.id !== member.id) });
      wx.showToast({ title: '已移除', icon: 'success' });
    } });
  },
  leave() {
    wx.showModal({ title: '退出成长圈', content: '退出后将无法查看圈内动态，确定退出吗？', success: async res => {
      if (!res.confirm) return;
      const result = await circle.leave();
      if (!result.ok) return wx.showToast({ title: result.error, icon: 'none' });
      wx.showToast({ title: '已退出成长圈', icon: 'success' });
      setTimeout(() => wx.navigateBack(), 500);
    } });
  }
});
