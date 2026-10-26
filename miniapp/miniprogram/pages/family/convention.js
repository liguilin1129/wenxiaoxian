const store = require('../../utils/store.js');

Page({
  data: { title: '', content: '', updatedAt: '' },
  onShow() {
    const convention = store.getFamilyConvention();
    this.setData(convention);
  },
  onTitle(e) { this.setData({ title: e.detail.value }); },
  onContent(e) { this.setData({ content: e.detail.value }); },
  save() {
    const convention = store.saveFamilyConvention({ title: this.data.title, content: this.data.content });
    this.setData(convention);
    wx.showToast({ title: '公约已保存', icon: 'success' });
  }
});
