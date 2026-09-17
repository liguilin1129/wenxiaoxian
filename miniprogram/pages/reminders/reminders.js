const store = require('../../utils/store.js');

const ROUTES = { checkin: '/pages/checkin/checkin', approvals: '/pages/approvals/approvals', family: '/pages/family/meeting', assessment: '/pages/assessment/assessment' };

Page({
  data: { reminders: [] },
  onShow() { this.refresh(); },
  refresh() { this.setData({ reminders: store.getSmartReminders() }); },
  handle(e) {
    const item = e.currentTarget.dataset.item;
    if (!item) return;
    store.markReminderRead(item.id);
    const url = ROUTES[item.target];
    if (url) wx.navigateTo({ url: url });
  },
  markRead(e) {
    const id = e.currentTarget.dataset.id;
    store.markReminderRead(id);
    this.refresh();
  },
  markAllRead() {
    if (!this.data.reminders.length) return;
    store.markAllRemindersRead();
    this.refresh();
    wx.showToast({ title: '提醒已全部标记为已读', icon: 'success' });
  }
});
