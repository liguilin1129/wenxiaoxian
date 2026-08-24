const TABS = [
  { key: 'feed', label: '成长圈' },
  { key: 'articles', label: '育儿干货' },
  { key: 'rank', label: '邻里榜' }
];
const URLS = {
  feed: '/pages/community/community',
  articles: '/pages/community/articles',
  rank: '/pages/community/rank'
};

Page({
  data: {
    tabs: TABS,
    articles: [
      { id: 1, title: '如何培养孩子的时间感知力', tag: '习惯养成', read: '2.3万', cover: '⏰' },
      { id: 2, title: '经典诵读对专注力的 4 个好处', tag: '经典学习', read: '1.8万', cover: '📜' },
      { id: 3, title: '积分制激励，怎么设才不翻车', tag: '家庭教育', read: '3.1万', cover: '🪙' }
    ]
  },
  onTabChange(e) {
    const url = URLS[e.detail.key];
    if (url) wx.redirectTo({ url });
  },
  openArticle(e) {
    const title = e.currentTarget.dataset.title;
    wx.showToast({ title: '打开《' + title + '》', icon: 'none' });
  }
});
