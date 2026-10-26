const store = require('../../utils/store.js');

Page({
  data: { title: '', source: '', url: '', resources: [] },
  onShow() { if (!store.isParentMode()) return wx.navigateBack(); this.refresh(); },
  refresh() { this.setData({ resources: store.getParentVideoResources() }); },
  input(e) { this.setData({ [e.currentTarget.dataset.key]: e.detail.value }); },
  add() {
    const item = store.addParentVideoResource(this.data);
    if (!item) return wx.showToast({ title: '请填写标题和有效的 HTTPS 链接', icon: 'none' });
    this.setData({ title: '', source: '', url: '' }); this.refresh(); wx.showToast({ title: '已添加', icon: 'success' });
  },
  remove(e) { if (store.removeParentVideoResource(e.currentTarget.dataset.id)) this.refresh(); }
});
