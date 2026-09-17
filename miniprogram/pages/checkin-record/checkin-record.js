const app = getApp();

const WEEK = ['日', '一', '二', '三', '四', '五', '六'];

function shortDate(date) {
  return ('0' + (date.getMonth() + 1)).slice(-2) + '-' + ('0' + date.getDate()).slice(-2);
}

function dateInHistory(date, records) {
  const key = shortDate(date);
  return records.some(item => item && item.delta > 0 && String(item.date || '').slice(-5) === key);
}

Page({
  data: { streak: 0, calendar: [], records: [], totalCheckins: 0 },
  onShow() { this.refresh(); },
  refresh() {
    const child = app.globalData.child || {};
    const records = (app.globalData.pointsHistory || []).filter(item => item.delta > 0);
    const todayDone = (app.globalData.todayTasks || []).some(task => task.done);
    const now = new Date();
    const calendar = [];
    for (let offset = 6; offset >= 0; offset--) {
      const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - offset);
      const isToday = offset === 0;
      calendar.push({
        day: WEEK[date.getDay()],
        date: shortDate(date),
        done: isToday ? (todayDone || dateInHistory(date, records)) : dateInHistory(date, records),
        today: isToday
      });
    }
    this.setData({
      streak: Number(child.streak) || 0,
      calendar: calendar,
      records: records.slice(0, 20),
      totalCheckins: records.length
    });
  }
});
