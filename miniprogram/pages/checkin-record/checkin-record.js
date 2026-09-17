const app = getApp();

const WEEK = ['日', '一', '二', '三', '四', '五', '六'];

function shortDate(date) {
  return ('0' + (date.getMonth() + 1)).slice(-2) + '-' + ('0' + date.getDate()).slice(-2);
}

function dateInHistory(date, records) {
  const key = shortDate(date);
  return records.some(item => item && item.delta > 0 && String(item.date || '').slice(-5) === key);
}

function makeCalendar(year, month, records, todayDone) {
  const firstWeekday = new Date(year, month, 1).getDay();
  const days = new Date(year, month + 1, 0).getDate();
  const now = new Date();
  const isCurrentMonth = now.getFullYear() === year && now.getMonth() === month;
  const cells = [];
  for (let i = 0; i < firstWeekday; i++) cells.push({ empty: true, key: 'empty-' + i });
  for (let day = 1; day <= days; day++) {
    const date = new Date(year, month, day);
    const today = isCurrentMonth && now.getDate() === day;
    const future = date.getTime() > new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    cells.push({
      key: 'day-' + day,
      day: day,
      today: today,
      future: future,
      done: !future && (today ? (todayDone || dateInHistory(date, records)) : dateInHistory(date, records))
    });
  }
  return cells;
}

Page({
  data: { streak: 0, calendar: [], records: [], totalCheckins: 0, year: 0, month: 0, monthLabel: '', weekLabels: WEEK },
  onShow() { this.refresh(); },
  refresh(year, month) {
    const child = app.globalData.child || {};
    const records = (app.globalData.pointsHistory || []).filter(item => item.delta > 0);
    const todayDone = (app.globalData.todayTasks || []).some(task => task.done);
    const now = new Date();
    const displayYear = Number.isInteger(year) ? year : now.getFullYear();
    const displayMonth = Number.isInteger(month) ? month : now.getMonth();
    const calendar = makeCalendar(displayYear, displayMonth, records, todayDone);
    this.setData({
      streak: Number(child.streak) || 0,
      calendar: calendar,
      records: records.slice(0, 20),
      totalCheckins: records.length,
      year: displayYear,
      month: displayMonth,
      monthLabel: displayYear + ' 年 ' + (displayMonth + 1) + ' 月'
    });
  },
  previousMonth() {
    let year = this.data.year;
    let month = this.data.month - 1;
    if (month < 0) { year--; month = 11; }
    this.refresh(year, month);
  },
  nextMonth() {
    let year = this.data.year;
    let month = this.data.month + 1;
    if (month > 11) { year++; month = 0; }
    this.refresh(year, month);
  }
});
