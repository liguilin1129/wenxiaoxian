const app = getApp();

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
const MOCK_FEED = [
  {
    id: 1,
    name: '贤妈',
    avatar: '贤',
    text: '小贤这周连续晨读经典 5 天，专注力肉眼可见地提升啦📖',
    time: '10 分钟前',
    likes: 12,
    comments: 3,
    liked: false
  },
  {
    id: 2,
    name: '乐乐爸',
    avatar: '乐',
    text: '分享一个亲子沟通小技巧：多用「我看到…」句式，少说「你为什么…」，孩子更愿意听。',
    time: '1 小时前',
    likes: 28,
    comments: 9,
    liked: false
  },
  {
    id: 3,
    name: '糖糖妈',
    avatar: '糖',
    text: '今天带娃完成好习惯挑战，顺利兑换了心心念念的乐高🎉 积分制真香！',
    time: '今天 09:20',
    likes: 45,
    comments: 6,
    liked: false
  }
];

function loadFeed() {
  const user = wx.getStorageSync('communityUserPosts') || [];
  return user.concat(MOCK_FEED);
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
  toggleLike(e) {
    const id = e.currentTarget.dataset.id;
    const feed = this.data.feed.map(f => {
      if (f.id !== id) return f;
      const liked = !f.liked;
      return Object.assign({}, f, { liked: liked, likes: f.likes + (liked ? 1 : -1) });
    });
    this.setData({ feed: feed });
  }
});
