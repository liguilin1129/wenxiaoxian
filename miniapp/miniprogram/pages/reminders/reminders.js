const store = require('../../utils/store.js');

const ROUTES = { checkin: '/pages/checkin/checkin', makeup: '/pages/makeup-checkin/makeup-checkin', family: '/pages/family/meeting', assessment: '/pages/assessment/assessment' };

Page({
  data: { signed: false, reminders: [] },
  onShow() {
    this.refresh();
    this.stopTimer();
    this._timer = setInterval(() => this.refresh(), 60000);
  },
  onHide() { this.stopTimer(); },
  onUnload() { this.stopTimer(); },
  stopTimer() { if (this._timer) clearInterval(this._timer); this._timer = null; },
  refresh() {
    const signed = !!store.isSigned();
    this.setData({ signed, reminders: signed ? store.getSmartReminders() : [] });
  },
  goLogin() { wx.navigateTo({ url: '/pages/login/login' }); },
  handle(e) {
    if (!store.isSigned()) { this.refresh(); return this.goLogin(); }
    const input = e.currentTarget.dataset.item;
    const item = input && store.getSmartReminders().find(entry => entry.id === input.id);
    if (!item) return this.refresh();
    const url = item.target === 'task'
      ? '/pages/task-detail/task-detail?id=' + encodeURIComponent(item.taskId)
      : ROUTES[item.target];
    if (url) wx.navigateTo({ url: url });
  }
});
