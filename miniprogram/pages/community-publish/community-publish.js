const app = getApp();
const fs = wx.getFileSystemManager();

const FEED_TAGS = ['日常', '打卡', '成长', '经验'];
const ARTICLE_TAGS = ['习惯养成', '经典学习', '家庭教育', '成长记录', '经验分享'];
const COVER_MAP = {
  '习惯养成': '⏰',
  '经典学习': '📜',
  '家庭教育': '🪙',
  '成长记录': '🌱',
  '经验分享': '💡'
};
const MAX_MEDIA = 9;

function saveLocal(tempPath) {
  return new Promise((resolve, reject) => {
    fs.saveFile({
      tempFilePath: tempPath,
      success: res => resolve(res.savedFilePath),
      fail: err => reject(err)
    });
  });
}

Page({
  data: {
    mode: 'feed', // feed | article
    tags: FEED_TAGS,
    tagIndex: 0,
    content: '',
    title: '',
    maxContent: 200,
    child: {},
    media: [] // { path, type, thumb }
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
  chooseMedia() {
    const remain = MAX_MEDIA - this.data.media.length;
    if (remain <= 0) {
      wx.showToast({ title: '最多添加 9 张图片或视频', icon: 'none' });
      return;
    }
    wx.chooseMedia({
      count: remain,
      mediaType: ['image', 'video'],
      sourceType: ['album', 'camera'],
      success: res => {
        const added = res.tempFiles.map(f => ({
          path: f.tempFilePath,
          type: f.fileType, // 'image' | 'video'
          thumb: f.thumbTempFilePath || f.tempFilePath,
          duration: f.duration || 0
        }));
        this.setData({ media: this.data.media.concat(added) });
      },
      fail: err => {
        if (err.errMsg && err.errMsg.indexOf('cancel') > -1) return;
        wx.showToast({ title: '选择失败', icon: 'none' });
      }
    });
  },
  previewMedia(e) {
    const idx = parseInt(e.currentTarget.dataset.index, 10);
    const sources = this.data.media.map(m => ({
      url: m.path,
      type: m.type,
      poster: m.thumb
    }));
    wx.previewMedia({ sources: sources, current: idx });
  },
  removeMedia(e) {
    const idx = parseInt(e.currentTarget.dataset.index, 10);
    const media = this.data.media.slice();
    media.splice(idx, 1);
    this.setData({ media: media });
  },
  submit() {
    const { mode, content, title, tags, tagIndex, child, media } = this.data;
    const tag = tags[tagIndex];

    if (mode === 'article' && !title.trim()) {
      wx.showToast({ title: '请输入标题', icon: 'none' });
      return;
    }
    if (!content.trim() && media.length === 0) {
      wx.showToast({ title: mode === 'article' ? '请输入正文或添加图片/视频' : '请输入内容或添加图片/视频', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '发布中…', mask: true });

    // 把临时文件转成本地持久文件，避免重启后失效
    const saveTasks = media.map(m => saveLocal(m.path).then(saved => ({
      path: saved,
      type: m.type,
      thumb: m.type === 'video' ? saved : saved,
      duration: m.duration
    })));

    Promise.all(saveTasks).then(savedMedia => {
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
          isUser: true,
          media: savedMedia
        });
        wx.setStorageSync('communityUserPosts', list);
      } else {
        const list = wx.getStorageSync('communityUserArticles') || [];
        list.unshift({
          id: 'a' + now,
          title: title.trim(),
          content: content.trim(),
          tag: tag,
          cover: COVER_MAP[tag] || '📖',
          read: '0',
          isUser: true,
          media: savedMedia
        });
        wx.setStorageSync('communityUserArticles', list);
      }
      wx.hideLoading();
      wx.showToast({ title: '发布成功', icon: 'success' });
      setTimeout(() => {
        wx.navigateBack();
      }, 600);
    }).catch(err => {
      wx.hideLoading();
      console.error('saveFile fail', err);
      wx.showToast({ title: '保存图片/视频失败', icon: 'none' });
    });
  }
});
