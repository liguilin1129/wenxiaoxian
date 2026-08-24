const app = getApp();

Page({
  data: {
    feed: [
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
    ],
    articles: [
      { id: 1, title: '如何培养孩子的时间感知力', tag: '习惯养成', read: '2.3万', cover: '⏰' },
      { id: 2, title: '经典诵读对专注力的 4 个好处', tag: '经典学习', read: '1.8万', cover: '📜' },
      { id: 3, title: '积分制激励，怎么设才不翻车', tag: '家庭教育', read: '3.1万', cover: '🪙' }
    ],
    ranks: [
      { id: 1, name: '小贤', avatar: '小', days: 21, me: true },
      { id: 2, name: '乐乐', avatar: '乐', days: 19, me: false },
      { id: 3, name: '糖糖', avatar: '糖', days: 17, me: false },
      { id: 4, name: '安安', avatar: '安', days: 15, me: false },
      { id: 5, name: '豆豆', avatar: '豆', days: 12, me: false }
    ]
  },
  onShow() {},
  toggleLike(e) {
    const id = e.currentTarget.dataset.id;
    const feed = this.data.feed.map(f => {
      if (f.id !== id) return f;
      const liked = !f.liked;
      return Object.assign({}, f, { liked: liked, likes: f.likes + (liked ? 1 : -1) });
    });
    this.setData({ feed: feed });
  },
  openArticle(e) {
    const title = e.currentTarget.dataset.title;
    wx.showToast({ title: '打开《' + title + '》', icon: 'none' });
  }
});
