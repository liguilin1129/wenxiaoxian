const app = getApp();
const store = require('../../utils/store.js');
const archive = require('../../utils/growth-archive.js');

function dateLabel() {
  const date = new Date();
  return date.getFullYear() + '年' + (date.getMonth() + 1) + '月' + date.getDate() + '日';
}

Page({
  data: { dims: [], neigong: [], rules: [], assessment: null, assessmentTrend: null, assessmentHistory: [], weekGain: 0, points: 0, streak: 0, done: 0, total: 0, completionPct: 0, earned: 0, spent: 0, recordCount: 0, focus: {}, strength: {}, suggestion: '', body: {}, hasBodyData: false },
  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 2 });
    }
    const g = app.globalData;
    const dims = g.dimensions || [];
    const focus = dims.reduce((lowest, item) => !lowest || item.pct < lowest.pct ? item : lowest, null) || {};
    const strength = dims.reduce((highest, item) => !highest || item.pct > highest.pct ? item : highest, null) || {};
    const today = g.todayTasks || [];
    const done = today.filter(item => item.done).length;
    const history = g.pointsHistory || [];
    const earned = history.filter(item => item.delta > 0).reduce((sum, item) => sum + item.delta, 0);
    const spent = Math.abs(history.filter(item => item.delta < 0).reduce((sum, item) => sum + item.delta, 0));
    const suggestion = focus.name ? ('本周可优先安排 1 项“' + focus.name + '”相关任务，完成后在家庭会议中一起复盘。') : '';
    const child = g.child || {};
    const body = { height: child.height || '未填写', weight: child.weight || '未填写', bmi: child.bmi || '填写身高体重后自动计算' };
    const assessmentHistory = store.getAssessmentHistory().slice().reverse().slice(0, 3);
    this.setData({ dims: dims, neigong: g.neigong || [], rules: store.getScoreRules(), assessment: store.getAssessment(), assessmentTrend: store.getAssessmentTrend(), assessmentHistory: assessmentHistory, weekGain: child.weekGain || 0, points: child.points || 0, streak: child.streak || 0, done: done, total: today.length, completionPct: today.length ? Math.round(done / today.length * 100) : 0, earned: earned, spent: spent, recordCount: history.length, focus: focus, strength: strength, suggestion: suggestion, body: body, hasBodyData: !!(child.height || child.weight) });
  },
  goCheckin() { wx.navigateTo({ url: '/pages/checkin/checkin' }); },
  goAssessment() { wx.navigateTo({ url: '/pages/assessment/assessment' }); },
  goProfileEdit() { wx.navigateTo({ url: '/pages/profile-edit/profile-edit' }); },
  saveArchive() {
    const assessment = this.data.assessment || {};
    archive.save({ date: dateLabel(), points: this.data.points, streak: this.data.streak, weekGain: this.data.weekGain, completionPct: this.data.completionPct, levelName: assessment.levelName || '', assessmentScore: assessment.overall || 0, strengthName: (assessment.strength || this.data.strength || {}).name || '', focusName: (assessment.focus || this.data.focus || {}).name || '', dims: this.data.dims.map(item => ({ key: item.key, name: item.name, pct: item.pct })), body: this.data.body });
    wx.showToast({ title: '已存入成长档案', icon: 'success' });
  },
  goArchive() { wx.navigateTo({ url: '/pages/growth-archive/growth-archive' }); }
});
