const app = getApp();

Page({
  data: {
    entries: [
      {
        key: 'classics',
        icon: '📚',
        title: '经典学习',
        desc: '17 部经典 · 对应五大内功养成',
        url: '/pages/classics/classics'
      },
      {
        key: 'rewards',
        icon: '🎁',
        title: '积分商城',
        desc: '用积分兑换心愿好礼',
        url: '/pages/rewards/rewards'
      },
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
    ]
  },
  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 2 });
    }
  },
  go(e) {
    const url = e.currentTarget.dataset.url;
    wx.navigateTo({ url: url });
  }
});
