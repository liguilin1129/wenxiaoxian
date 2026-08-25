const app = getApp();
const store = require('../../utils/store.js');

Page({
  data: {
    keyword: '',
    tab: 'selected',
    courses: [],
    cases: [],
    displayCases: [],
    expanded: {}
  },
  onShow() {
    this.setData({
      courses: app.globalData.courses || [],
      cases: (app.globalData.cases || []).map(c => this.enrichCase(c))
    }, () => this.filterCases());
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
  onSearch(e) {
    this.setData({ keyword: e.detail.value });
  },
  doSearch() {
    this.filterCases();
  },
  switchTab(e) {
    this.setData({ tab: e.currentTarget.dataset.tab }, () => this.filterCases());
  },
  filterCourse(e) {
    const id = e.currentTarget.dataset.id;
    const course = this.data.courses.find(c => c.id === id);
    if (!course) return;
    this.setData({ keyword: course.name }, () => this.filterCases());
  },
  filterCases() {
    const { cases, tab, keyword } = this.data;
    let list = cases.slice();
    if (tab === 'selected') list = list.filter(c => c.selected);
    else if (tab === 'fav') list = list.filter(c => c.faved);
    if (keyword.trim()) {
      const k = keyword.trim().toLowerCase();
      list = list.filter(c =>
        c.title.toLowerCase().includes(k) ||
        c.summary.toLowerCase().includes(k) ||
        c.course.toLowerCase().includes(k)
      );
    }
    this.setData({ displayCases: list });
  },
  toggleExpand(e) {
    const id = e.currentTarget.dataset.id;
    const expanded = this.data.expanded;
    expanded[id] = !expanded[id];
    this.setData({ expanded: expanded });
  },
  likeCase(e) {
    const id = e.currentTarget.dataset.id;
    store.toggleCaseLike(id);
    const cases = this.data.cases.map(c => {
      if (c.id !== id) return c;
      const liked = !c.liked;
      return Object.assign({}, c, { liked: liked, likeCount: c.likeCount + (liked ? 1 : -1) });
    });
    this.setData({ cases: cases }, () => this.filterCases());
  },
  favCase(e) {
    const id = e.currentTarget.dataset.id;
    store.toggleCaseFav(id);
    const cases = this.data.cases.map(c => {
      if (c.id !== id) return c;
      const faved = !c.faved;
      return Object.assign({}, c, { faved: faved, favCount: c.favCount + (faved ? 1 : -1) });
    });
    this.setData({ cases: cases }, () => this.filterCases());
  },
  goDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: '/pages/case-detail/case-detail?id=' + id });
  }
});
