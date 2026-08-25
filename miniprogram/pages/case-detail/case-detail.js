const app = getApp();
const store = require('../../utils/store.js');

Page({
  data: { case: null },
  onLoad(query) {
    const id = query.id;
    const raw = (app.globalData.cases || []).find(c => c.id === id);
    if (!raw) {
      wx.showToast({ title: '案例不存在', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 500);
      return;
    }
    this.setData({ case: this.enrichCase(raw) });
  },
  enrichCase(c) {
    const liked = store.isCaseLiked(c.id);
    const faved = store.isCaseFaved(c.id);
    return Object.assign({}, c, {
      liked: liked,
      faved: faved,
      likeCount: c.likeCount + (liked ? 1 : 0),
      favCount: c.favCount + (faved ? 1 : 0)
    });
  },
  likeCase() {
    const c = this.data.case;
    if (!c) return;
    store.toggleCaseLike(c.id);
    const liked = !c.liked;
    this.setData({
      'case.liked': liked,
      'case.likeCount': c.likeCount + (liked ? 1 : -1)
    });
  },
  favCase() {
    const c = this.data.case;
    if (!c) return;
    store.toggleCaseFav(c.id);
    const faved = !c.faved;
    this.setData({
      'case.faved': faved,
      'case.favCount': c.favCount + (faved ? 1 : -1)
    });
  }
});
