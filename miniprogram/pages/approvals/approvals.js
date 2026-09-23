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
    if (res.forbidden) return wx.showToast({ title: '请切换到家长模式后确认', icon: 'none' });
    wx.showToast({ title: res.levelUp ? ('升级为 ' + res.levelName) : ('已确认，积分 +' + res.points + ' · 经验 +' + res.experience), icon: 'none' });
    this.refresh();
  },
  reject(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '退回本次打卡？',
      content: '退回后孩子可以重新提交。',
      confirmText: '退回',
      success: (result) => {
        if (!result.confirm) return;
        const rejected = store.rejectCenter(id);
        if (rejected && rejected.forbidden) return wx.showToast({ title: '请切换到家长模式后处理', icon: 'none' });
        if (!rejected) return;
        wx.showToast({ title: '已退回', icon: 'none' });
        this.refresh();
      }
    });
  },
  previewEvidence(e) { const list = e.currentTarget.dataset.list || []; const index = Number(e.currentTarget.dataset.index) || 0; wx.previewMedia({ sources: list.map(item => ({ url: item.path, type: item.type, poster: item.thumb || item.path })), current: index }); }
});
