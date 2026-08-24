const app = getApp();

const FEED_TAGS = ['日常', '打卡', '成长', '经验'];
const ARTICLE_TAGS = ['习惯养成', '经典学习', '家庭教育', '成长记录', '经验分享'];
const COVER_MAP = {
  '习惯养成': '⏰',
  '经典学习': '📜',
  '家庭教育': '🪙',
  '成长记录': '🌱',
  '经验分享': '💡'
};

Page({
  data: {
    mode: 'feed', // feed | article
    tags: FEED_TAGS,
    tagIndex: 0,
    content: '',
    title: '',
    maxContent: 200,
    child: {}
  },
  onLoad(query) {
    const mode = query.mode === 'article' ? 'article' : 'feed';
    const tags = mode === 'article' ? ARTICLE_TAGS : FEED_TAGS;
    const title = mode === 'article' ? '写经验' : '发动态';
    wx.setNavigationBarTitle({ title: title });
    this.setData({
      mode: mode,
      tags: tags,
      tagIndex: 0,
      child: app.globalData.child || {}
    });
  },
  onContentInput(e) {
    let v = e.detail.value;
    if (v.length > this.data.maxContent) v = v.slice(0, this.data.maxContent);
    this.setData({ content: v });
  },
  onTitleInput(e) {
    this.setData({ title: e.detail.value });
  },
  onTagChange(e) {
    this.setData({ tagIndex: parseInt(e.detail.value, 10) });
  },
  submit() {
    const { mode, content, title, tags, tagIndex, child } = this.data;
    const tag = tags[tagIndex];

    if (mode === 'article' && !title.trim()) {
      wx.showToast({ title: '请输入标题', icon: 'none' });
      return;
    }
    if (!content.trim()) {
      wx.showToast({ title: mode === 'article' ? '请输入正文' : '请输入动态内容', icon: 'none' });
      return;
    }

    const now = Date.now();
    if (mode === 'feed') {
      const list = wx.getStorageSync('communityUserPosts') || [];
      list.unshift({
        id: 'p' + now,
        name: '我',
        avatar: child.avatar || '我',
        text: content.trim(),
        tag: tag,
        time: '刚刚',
        likes: 0,
        comments: 0,
        liked: false,
        isUser: true
      });
      wx.setStorageSync('communityUserPosts', list);
      wx.showToast({ title: '动态已发布', icon: 'success' });
    } else {
      const list = wx.getStorageSync('communityUserArticles') || [];
      list.unshift({
        id: 'a' + now,
        title: title.trim(),
        content: content.trim(),
        tag: tag,
        cover: COVER_MAP[tag] || '📖',
        read: '0',
        isUser: true
      });
      wx.setStorageSync('communityUserArticles', list);
      wx.showToast({ title: '经验已发布', icon: 'success' });
    }

    setTimeout(() => {
      wx.navigateBack();
    }, 600);
  }
});
