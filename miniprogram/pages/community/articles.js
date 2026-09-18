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
function loadArticles() {
  return getCommunityArticles();
}

Page({
  data: {
    tabs: TABS,
    articles: []
  },
  onLoad() {
    this.setData({ articles: loadArticles() });
  },
  onShow() {
    this.setData({ articles: loadArticles() });
  },
  onTabChange(e) {
    const url = URLS[e.detail.key];
    if (url) wx.redirectTo({ url });
  },
  goPublish() {
    wx.navigateTo({ url: '/pages/community-publish/community-publish?mode=article' });
  },
  openArticle(e) {
    wx.navigateTo({ url: '/pages/article-detail/article-detail?id=' + encodeURIComponent(e.currentTarget.dataset.id) });
  }
});
const { getCommunityArticles } = require('../../utils/community-article-data.js');
