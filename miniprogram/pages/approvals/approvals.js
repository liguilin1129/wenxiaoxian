const app = getApp();
const store = require('../../utils/store.js');

Page({
  data: { list: [], dimName: {} },
  onShow() { this.refresh(); },
  refresh() {
    const dimName = {};
    app.globalData.dimensions.forEach(dim => { dimName[dim.key] = dim.name; });
    this.setData({ list: store.getPendingApprovals(), dimName: dimName });
  },
  approve(e) {
    const id = e.currentTarget.dataset.id;
    const res = store.approveCenter(id);
    if (!res) return;
    wx.showToast({ title: '已确认，积分 +' + res.points, icon: 'none' });
    this.refresh();
  },
  reject(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '退回本次打卡？',
      content: '退回后孩子可以重新提交。',
      confirmText: '退回',
      success: (result) => {
        if (!result.confirm || !store.rejectCenter(id)) return;
        wx.showToast({ title: '已退回', icon: 'none' });
        this.refresh();
      }
    });
  }
});
