const archive = require('../../utils/growth-archive.js');

Page({
  data: { records: [], selectedId: '' },
  onShow() { this.load(); },
  load() { this.setData({ records: archive.list() }); },
  toggle(e) {
    const id = e.currentTarget.dataset.id;
    this.setData({ selectedId: this.data.selectedId === id ? '' : id });
  },
  remove(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({ title: '删除档案', content: '仅删除当前设备上的这条成长记录，确定继续吗？', success: res => {
      if (!res.confirm) return;
      archive.remove(id);
      this.setData({ selectedId: '', records: archive.list() });
      wx.showToast({ title: '已删除', icon: 'success' });
    } });
  }
});
