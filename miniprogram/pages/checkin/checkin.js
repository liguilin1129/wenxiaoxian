const app = getApp();
const store = require('../../utils/store.js');

const WEEK = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

function dimNameMap() {
  const m = {};
  app.globalData.dimensions.forEach(d => { m[d.key] = d.name; });
  return m;
}

Page({
  data: { tasks: [], gain: 0, done: 0, total: 0, dimName: {}, today: '' },
  onShow() { this.refresh(); },
  refresh() {
    const g = app.globalData;
    const d = new Date();
    const today = d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2) + ' ' + WEEK[d.getDay()];
    this.setData({
      tasks: g.todayTasks,
      gain: store.todayGain(),
      done: store.todayDoneCount(),
      total: g.todayTasks.length,
      dimName: dimNameMap(),
      today: today
    });
  },
  toggle(e) {
    const index = e.currentTarget.dataset.index;
    const res = store.toggleTodayTask(index);
    if (res) {
      const tip = res.delta > 0 ? '打卡 +' + res.delta + ' 分' : '已取消打卡';
      wx.showToast({ title: tip, icon: 'none' });
      this.refresh();
    }
  }
});
