const store = require('../../utils/store');
const bank = require('../../utils/growth-bank');
Page({
  data: { signed: false, isParent: false, consent: false, tab: 'dashboard', tabs: [
    { key: 'dashboard', name: '数据板' }, { key: 'events', name: '成长记录' }, { key: 'flows', name: '积分流水' }
  ], indicators: bank.INDICATORS, indicatorIndex: 0, difficulties: ['简单 ×1', '中等 ×1.5', '困难 ×2'],
  qualities: ['需改进 ×0.8', '良好 ×1', '优秀 ×1.2'], difficultyIndex: 0, qualityIndex: 1,
  text: '', images: [], dimensions: [], events: [], flows: [], credits: 0, pending: 0 },
  onShow() { this.refresh(); },
  refresh() {
    const signed = !!store.isSigned();
    if (!signed) return this.setData({ signed: false });
    store.refreshBankPoints();
    const g = getApp().globalData;
    this.setData(Object.assign(bank.overview(), { signed, isParent: store.isParentMode(),
      balance: g.child.points, done: store.todayDoneCount(), total: g.todayTasks.length }));
  },
  run(action) { try { action(); this.refresh(); } catch (error) { wx.showToast({ title: error.message, icon: 'none' }); } },
  switchTab(e) { this.setData({ tab: e.currentTarget.dataset.key }); },
  goChallenges(e) {
    if (!store.isSigned()) return wx.navigateTo({ url: '/pages/login/login' });
    const tab = e.currentTarget.dataset.tab;
    if (tab !== 'official' && tab !== 'family') return;
    wx.navigateTo({ url: '/pages/challenges/challenges?tab=' + tab });
  },
  grantConsent() { this.run(() => bank.consent(true)); },
  revokeConsent() { this.run(() => bank.consent(false)); },
  onText(e) { this.setData({ text: e.detail.value }); },
  pickIndicator(e) { this.setData({ indicatorIndex: Number(e.detail.value) }); },
  pickDifficulty(e) { this.setData({ difficultyIndex: Number(e.detail.value) }); },
  pickQuality(e) { this.setData({ qualityIndex: Number(e.detail.value) }); },
  chooseImages() {
    if (!store.isParentMode() || !this.data.consent) return;
    wx.chooseMedia({ count: 3 - this.data.images.length, mediaType: ['image'], sourceType: ['album', 'camera'],
      success: res => {
        const files = res.tempFiles || [];
        Promise.all(files.map(file => new Promise((resolve, reject) => wx.saveFile({ tempFilePath: file.tempFilePath,
          success: result => resolve(result.savedFilePath), fail: () => reject(new Error('图片保存失败，请重试')) }))))
          .then(paths => this.setData({ images: this.data.images.concat(paths).slice(0, 3) }))
          .catch(error => wx.showToast({ title: error.message, icon: 'none' }));
      }
    });
  },
  removeImage(e) {
    const index = Number(e.currentTarget.dataset.index);
    const path = this.data.images[index];
    if (path) wx.removeSavedFile({ filePath: path });
    this.setData({ images: this.data.images.filter((_, i) => i !== index) });
  },
  submit() { this.run(() => { bank.create({ text: this.data.text, images: this.data.images,
    indicator: bank.INDICATORS[this.data.indicatorIndex].code }); this.setData({ text: '', images: [] });
    wx.showToast({ title: '已记录，待家长确认', icon: 'none' }); }); },
  confirm(e) { this.run(() => bank.confirm(e.currentTarget.dataset.id,
    bank.RULE.difficulties[this.data.difficultyIndex], bank.RULE.qualities[this.data.qualityIndex])); },
  reverse(e) { wx.showModal({ title: '冲正积分', content: '保留原流水，并追加等额负向流水。确定撤销此笔计分吗？',
    success: res => { if (res.confirm) this.run(() => bank.reverse(e.currentTarget.dataset.id)); } }); },
  preview(e) { const event = this.data.events.find(item => item.id === e.currentTarget.dataset.id);
    if (event) wx.previewImage({ current: e.currentTarget.dataset.path, urls: event.images }); },
  exportData() { this.run(() => { const fs = wx.getFileSystemManager(); const path = wx.env.USER_DATA_PATH + '/growth-bank-export.json';
    fs.writeFileSync(path, bank.exportData(), 'utf8'); wx.showModal({ title: '已导出成长银行数据', content: 'JSON 文件已保存到小程序文件空间，可通过分享文件发送给自己。', showCancel: false });
    if (wx.shareFileMessage) wx.shareFileMessage({ filePath: path, fileName: '成长银行.json' }); }); },
  deleteContent() { wx.showModal({ title: '删除成长记录内容', content: '将删除文字与图片引用并撤销授权。已入账的积分凭证保留，不改变余额。不可恢复。',
    success: res => { if (res.confirm) this.run(() => {
      const paths = this.data.events.reduce((list, item) => list.concat(item.images || []), []).concat(this.data.images);
      bank.deleteContent(); this.setData({ text: '', images: [] });
      // 只删除本模块明确记录的图片，绝不清空整个小程序文件空间。
      paths.forEach(path => wx.removeSavedFile({ filePath: path, fail: () => {} }));
    }); } }); },
  go(e) { const key = e.currentTarget.dataset.key; const routes = { points: '/pages/points/points', rewards: '/pages/rewards/rewards',
    badges: '/pages/badges/badges', report: '/pages/report/report', reminders: '/pages/reminders/reminders', login: '/pages/login/login' };
    if (key === 'tasks') return wx.navigateTo({ url: '/pages/tasks/tasks' });
    if (routes[key]) wx.navigateTo({ url: routes[key] }); }
});
