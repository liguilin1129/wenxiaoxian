const app = getApp();
const { findCommunityArticle } = require('../../utils/community-article-data.js');

Page({
  data: {
    article: null
  },
  onLoad(query) {
    const id = query.id;
    const articles = app.globalData.discoverArticles || [];
    const article = articles.find(a => String(a.id) === String(id)) || findCommunityArticle(id);
    if (!article) {
      wx.showToast({ title: '文章不存在', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 800);
      return;
    }
    this.setData({ article: article });
    wx.setNavigationBarTitle({ title: article.title });
  }
});
