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
        desc: '成长圈 · 育儿干货 · 邻里打卡榜',
        url: '/pages/community/community'
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
