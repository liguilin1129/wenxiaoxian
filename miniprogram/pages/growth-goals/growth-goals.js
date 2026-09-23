const store = require('../../utils/store.js');

Page({
  data: { templates: [], goals: [], members: [], assignee: '', isParent: true },
  onShow() {
    const members = store.getFamilyMembers().filter(item => item.role === '孩子');
    const assessment = store.getAssessment();
    const recommended = assessment && Array.isArray(assessment.dimensions) ? assessment.dimensions.slice().sort((a, b) => a.score - b.score).slice(0, 2).map(item => item.key) : [];
    const templates = store.getGrowthGoalTemplates().map(item => Object.assign({}, item, { recommended: recommended.indexOf(item.key) >= 0 })).sort((a, b) => Number(b.recommended) - Number(a.recommended));
    this.setData({ templates, goals: store.getGrowthGoals(), members, assignee: this.data.assignee || (members[0] && members[0].name) || '', isParent: store.isParentMode() });
  },
  selectMember(e) { this.setData({ assignee: e.currentTarget.dataset.name }); },
  addGoal(e) {
    if (!store.isParentMode()) return wx.showToast({ title: '请切换到家长模式后设置目标', icon: 'none' });
    const goal = store.createGrowthGoal({ dim: e.currentTarget.dataset.dim, assignee: this.data.assignee });
    if (!goal) return wx.showToast({ title: '最多同时进行 2 个不同维度的目标', icon: 'none' });
    this.setData({ goals: store.getGrowthGoals() });
    wx.showToast({ title: '已开启第一阶段任务', icon: 'success' });
  },
  goTasks() { wx.navigateTo({ url: '/pages/task-manage/task-manage' }); }
});
