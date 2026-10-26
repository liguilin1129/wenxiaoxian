const app = getApp();
const mock = require('../../utils/mock.js');

Page({
  data: {
    name: '',
    book: { name: '', read: 0, total: 0, color: '#6366F1' },
    chapters: [],
    view: 'dir',        // dir | reader
    current: null,
    curIndex: -1,
    pct: 0
  },

  onLoad(query) {
    const name = decodeURIComponent(query.name || '');
    const book = app.globalData.classics.find(c => c.name === name) ||
      { name: name, read: 0, total: 0, color: '#6366F1' };
    const raw = mock.classicChapters[name] || [];
    const visited = (app.globalData.classicVisited && app.globalData.classicVisited[name]) || [];
    this.visited = visited.slice();
    const chapters = raw.map(c => Object.assign({}, c, { done: this.visited.indexOf(c.no) >= 0 }));
    const pct = book.total ? Math.min(100, Math.round(book.read / book.total * 100)) : 0;
    this.setData({ name, book, chapters, pct });
    wx.setNavigationBarTitle({ title: '诵读《' + name + '》' });
  },

  enterChapter(no) {
    const idx = this.data.chapters.findIndex(c => c.no === no);
    if (idx < 0) return;
    // 已读 +1（仅首次打开该章计数，避免重复计）
    if (this.visited.indexOf(no) < 0) {
      this.visited.push(no);
      const g = app.globalData;
      if (!g.classicVisited) g.classicVisited = {};
      g.classicVisited[this.data.name] = this.visited.slice();
      const bk = g.classics.find(c => c.name === this.data.name);
      if (bk) bk.read = Math.min(this.visited.length, bk.total);
      wx.setStorageSync('classicVisited', g.classicVisited);
    }
    const chapters = this.data.chapters.map(c =>
      Object.assign({}, c, { done: this.visited.indexOf(c.no) >= 0 }));
    const read = Math.min(this.visited.length, this.data.book.total);
    const book = Object.assign({}, this.data.book, { read: read });
    const pct = book.total ? Math.min(100, Math.round(book.read / book.total * 100)) : 0;
    this.setData({
      chapters, book, pct,
      view: 'reader',
      current: this.data.chapters[idx],
      curIndex: idx
    });
  },

  openChapter(e) {
    this.enterChapter(Number(e.currentTarget.dataset.no));
  },

  goPrev() {
    if (this.data.curIndex > 0) this.enterChapter(this.data.chapters[this.data.curIndex - 1].no);
  },
  goNext() {
    if (this.data.curIndex < this.data.chapters.length - 1)
      this.enterChapter(this.data.chapters[this.data.curIndex + 1].no);
  },

  backToDir() {
    this.setData({ view: 'dir', current: null, curIndex: -1 });
  }
});
