const app = getApp();

const CATEGORIES = ['全部', '优秀文章', '报道', '采访'];

Page({
  data: {
    categories: CATEGORIES,
    current: '全部',
    articles: []
  },
  onLoad() {
    this.setData({ articles: app.globalData.discoverArticles || [] });
  },
  onShow() {
    this.setData({ articles: app.globalData.discoverArticles || [] });
  },
  switchCategory(e) {
    this.setData({ current: e.currentTarget.dataset.cat });
  },
  filteredArticles() {
    const all = this.data.articles;
    return this.data.current === '全部'
      ? all
      : all.filter(a => a.category === this.data.current);
  },
  goDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: '/pages/article-detail/article-detail?id=' + id });
  }
});
