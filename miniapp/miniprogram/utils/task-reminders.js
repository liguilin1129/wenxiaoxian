const { dayKey } = require('./task-journal');

function validDay(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return false;
  const parts = value.split('-').map(Number);
  return dayKey(new Date(parts[0], parts[1] - 1, parts[2])) === value;
}

// Reminders describe unresolved work, not unread messages. Reading never clears them.
function buildTaskReminders(tasks, makeup, today) {
  const parts = today.split('-').map(Number);
  const tomorrow = dayKey(new Date(parts[0], parts[1] - 1, parts[2] + 1));
  const pending = tasks.filter(task => !task.done && task.active !== false &&
    (!validDay(task.deadline) || task.deadline >= today));
  const result = pending.filter(task => validDay(task.deadline) && task.deadline <= tomorrow)
    .sort((a, b) => a.deadline.localeCompare(b.deadline) || String(a.id).localeCompare(String(b.id)))
    .map(task => ({
      id: 'deadline-' + today + '-' + task.id + '-' + task.deadline,
      kind: 'deadline', priority: task.deadline === today ? 0 : 1,
      title: task.deadline === today ? '今日到期' : '明日到期',
      text: task.name + ' · ' + (task.deadline === today ? '今天' : '明天') + '截止',
      target: 'task', taskId: task.id, action: '查看任务'
    }));
  if (pending.length) result.push({
    id: 'daily-' + today + '-' + pending.map(task => task.id).sort().join('-'),
    kind: 'checkin', priority: 2, title: '今日待办',
    text: '今日有 ' + pending.length + ' 个任务待打卡／完成',
    target: 'checkin', action: '去打卡'
  });
  if (makeup.eligible) result.push({
    id: 'makeup-' + makeup.start + '-' + makeup.end,
    kind: 'makeup', priority: 3, title: '可集中补打卡',
    text: '最近七天有 ' + makeup.items.length + ' 项可补记任务',
    target: 'makeup', action: '去补卡'
  });
  return result;
}

module.exports = { buildTaskReminders };
