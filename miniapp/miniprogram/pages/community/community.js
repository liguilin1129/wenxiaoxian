const app = getApp();
const { getCommunityFeed } = require('../../utils/community-data.js');

const TABS = [
  { key: 'feed', label: '成长社区' },
  { key: 'articles', label: '育儿干货' },
  { key: 'rank', label: '成长榜' }
];
const URLS = {
  feed: '/pages/community/community',
  articles: '/pages/community/articles',
  rank: '/pages/community/rank'
};
function loadFeed() {
  return getCommunityFeed();
}

Page({
  data: {
    tabs: TABS,
    feed: []
  },
  onLoad() {
    this.setData({ feed: loadFeed() });
  },
  onShow() {
    this.setData({ feed: loadFeed() });
  },
  onTabChange(e) {
    const url = URLS[e.detail.key];
    if (url) wx.redirectTo({ url });
  },
  goPublish() {
    wx.navigateTo({ url: '/pages/community-publish/community-publish?mode=feed' });
  },
  goPost(e) {
    wx.navigateTo({ url: '/pages/community/post-detail?id=' + encodeURIComponent(e.currentTarget.dataset.id) });
  },
  toggleLike(e) {
    const id = e.currentTarget.dataset.id;
    const feed = this.data.feed.map(f => {
      if (f.id !== id) return f;
      const liked = !f.liked;
      return Object.assign({}, f, { liked: liked, likes: f.likes + (liked ? 1 : -1) });
    });
    this.setData({ feed: feed });
  },
  previewMedia(e) {
    const list = e.currentTarget.dataset.list || [];
    const idx = parseInt(e.currentTarget.dataset.index, 10) || 0;
    const sources = list.map(m => ({
      url: m.path,
      type: m.type,
      poster: m.thumb
    }));
    wx.previewMedia({ sources: sources, current: idx });
  }
});
