const app = getApp();
const store = require('../../utils/store.js');

Page({
  data: { dims: [], neigong: [], rules: [], assessment: null, weekGain: 0, points: 0, streak: 0, done: 0, total: 0, completionPct: 0, earned: 0, spent: 0, recordCount: 0, focus: {}, strength: {}, suggestion: '' },
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
    this.setData({ dims: dims, neigong: g.neigong || [], rules: store.getScoreRules(), assessment: store.getAssessment(), weekGain: g.child.weekGain || 0, points: g.child.points || 0, streak: g.child.streak || 0, done: done, total: today.length, completionPct: today.length ? Math.round(done / today.length * 100) : 0, earned: earned, spent: spent, recordCount: history.length, focus: focus, strength: strength, suggestion: suggestion });
  }
});
