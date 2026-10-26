const store = require('../../utils/store');
const ENTRIES = [
  { key: 'meeting', name: '家庭会议', mark: '议', url: '/pages/family/meeting' },
  { key: 'report', name: '成长报告', mark: '报', url: '/pages/report/report' },
  { key: 'assessment', name: '成长初评', mark: '评', url: '/pages/assessment/assessment' },
  { key: 'templates', name: '教育模板', mark: '模', url: '/pages/education-templates/education-templates' }
];
Page({
  data: { signed: false, isParent: false, entries: ENTRIES },
  onShow() { this.setData({ signed: !!store.isSigned(), isParent: store.isParentMode() }); },
  go(e) {
    if (!store.isSigned()) return this.goLogin();
    if (!store.isParentMode()) return wx.showToast({ title: '请由家长模式操作', icon: 'none' });
    const entry = ENTRIES.find(item => item.key === e.currentTarget.dataset.key);
    if (entry) wx.navigateTo({ url: entry.url });
  },
  goLogin() { wx.navigateTo({ url: '/pages/login/login' }); }
});
