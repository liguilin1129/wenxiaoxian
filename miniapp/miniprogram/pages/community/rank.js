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

Page({
  data: {
    tabs: TABS,
    ranks: [
      { id: 1, name: '小贤', avatar: '小', days: 21, me: true },
      { id: 2, name: '乐乐', avatar: '乐', days: 19, me: false },
      { id: 3, name: '糖糖', avatar: '糖', days: 17, me: false },
      { id: 4, name: '安安', avatar: '安', days: 15, me: false },
      { id: 5, name: '豆豆', avatar: '豆', days: 12, me: false }
    ]
  },
  onTabChange(e) {
    const url = URLS[e.detail.key];
    if (url) wx.redirectTo({ url });
  }
});
