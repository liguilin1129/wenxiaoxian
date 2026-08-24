const app = getApp();

Page({
  data: {
    article: null
  },
  onLoad(query) {
    const id = query.id;
    const articles = app.globalData.discoverArticles || [];
    const article = articles.find(a => a.id === id);
    if (!article) {
      wx.showToast({ title: '文章不存在', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 800);
      return;
    }
    this.setData({ article: article });
    wx.setNavigationBarTitle({ title: article.title });
  }
});
