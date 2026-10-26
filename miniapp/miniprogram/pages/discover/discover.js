const ENTRIES = [
      {
        key: 'community',
        icon: '💬',
        title: '社区',
        desc: '成长社区 · 育儿干货 · 成长榜',
        url: '/pages/community/community'
      },
      {
        key: 'articles',
        icon: '📰',
        title: '文章',
        desc: '优秀文章 · 报道 · 采访',
        url: '/pages/article-list/article-list'
      },
      {
        key: 'cases',
        icon: '🌟',
        title: '学员案例',
        desc: '家庭教育真实蜕变故事',
        url: '/pages/case-list/case-list'
      }
];

Page({
  data: { entries: ENTRIES },
  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 2 });
    }
    // 发现页只提供阅读与浏览入口，不会修改家庭数据；两种模式均可完整查看。
    this.setData({ entries: ENTRIES });
  },
  go(e) {
    const url = e.currentTarget.dataset.url;
    wx.navigateTo({ url: url });
  }
});
